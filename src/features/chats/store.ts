import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/shared/lib/storage';
import {
  canTransition,
  isPhoneChatId,
  type Chat,
  type ChatEvent,
  type Message,
  type MessageStatus,
} from './model';

export const MAX_MESSAGES_PER_CHAT = 500;

interface ChatsData {
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  activeChatId: string | null;
}

interface ChatsActions {
  upsertChat: (chat: Pick<Chat, 'chatId' | 'name' | 'phone'>) => void;
  openChat: (chatId: string | null) => void;
  addOutgoing: (chatId: string, text: string) => string;
  setSending: (chatId: string, id: string) => void;
  markQueued: (chatId: string, localId: string, idMessage: string) => void;
  markFailed: (chatId: string, id: string, error: string) => void;
  removeMessage: (chatId: string, id: string) => void;
  applyEvent: (event: ChatEvent) => void;
  reset: () => void;
}

export type ChatsState = ChatsData & ChatsActions;

const initialData = (): ChatsData => ({ chats: {}, messages: {}, activeChatId: null });

const storageKey = (idInstance: string) => `green-chat:data:${idInstance}`;

let localSeq = 0;
const newLocalId = () => `local:${Date.now().toString(36)}:${(localSeq++).toString(36)}`;

function insertSorted(list: Message[], msg: Message): Message[] {
  let i = list.length;
  while (i > 0 && list[i - 1]!.timestamp > msg.timestamp) i--;
  const next = [...list.slice(0, i), msg, ...list.slice(i)];
  return next.length > MAX_MESSAGES_PER_CHAT ? next.slice(-MAX_MESSAGES_PER_CHAT) : next;
}

function updateMessage(
  list: Message[] | undefined,
  id: string,
  patch: (m: Message) => Message | null,
): Message[] | undefined {
  if (!list) return undefined;
  const i = list.findIndex((m) => m.id === id);
  if (i === -1) return undefined;
  const updated = patch(list[i]!);
  if (updated === list[i]) return undefined;
  const next = [...list];
  if (updated) next[i] = updated;
  else next.splice(i, 1);
  return next;
}

function touchChat(chat: Chat, timestamp: number): Chat {
  return timestamp > (chat.lastMessageAt ?? 0) ? { ...chat, lastMessageAt: timestamp } : chat;
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      upsertChat: ({ chatId, name, phone }) =>
        set((s) => {
          const existing = s.chats[chatId];
          const chat: Chat = existing
            ? { ...existing, name: name || existing.name, phone: phone ?? existing.phone }
            : { chatId, name, phone, unread: 0, createdAt: Date.now() };
          return { chats: { ...s.chats, [chatId]: chat } };
        }),

      openChat: (chatId) =>
        set((s) => {
          const chat = chatId ? s.chats[chatId] : undefined;
          if (!chat) return { activeChatId: null };
          return {
            activeChatId: chatId,
            chats: chat.unread ? { ...s.chats, [chat.chatId]: { ...chat, unread: 0 } } : s.chats,
          };
        }),

      addOutgoing: (chatId, text) => {
        const id = newLocalId();
        const timestamp = Date.now();
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const msg: Message = {
            id,
            key: id,
            chatId,
            direction: 'out',
            kind: 'text',
            text,
            timestamp,
            status: 'sending',
          };
          return {
            messages: { ...s.messages, [chatId]: insertSorted(s.messages[chatId] ?? [], msg) },
            chats: { ...s.chats, [chatId]: touchChat(chat, timestamp) },
          };
        });
        return id;
      },

      setSending: (chatId, id) =>
        set((s) => {
          const list = updateMessage(s.messages[chatId], id, (m) =>
            canTransition(m.status, 'sending') ? { ...m, status: 'sending', error: undefined } : m,
          );
          return list ? { messages: { ...s.messages, [chatId]: list } } : s;
        }),

      markQueued: (chatId, localId, idMessage) =>
        set((s) => {
          const current = s.messages[chatId];
          if (!current) return s;
          // The webhook can arrive before the sendMessage response.
          const duplicate = current.some((m) => m.id === idMessage);
          const list = updateMessage(current, localId, (m) =>
            duplicate ? null : { ...m, id: idMessage, status: 'queued' },
          );
          return list ? { messages: { ...s.messages, [chatId]: list } } : s;
        }),

      markFailed: (chatId, id, error) =>
        set((s) => {
          const list = updateMessage(s.messages[chatId], id, (m) =>
            canTransition(m.status, 'failed') ? { ...m, status: 'failed', error } : m,
          );
          return list ? { messages: { ...s.messages, [chatId]: list } } : s;
        }),

      removeMessage: (chatId, id) =>
        set((s) => {
          const list = updateMessage(s.messages[chatId], id, () => null);
          return list ? { messages: { ...s.messages, [chatId]: list } } : s;
        }),

      applyEvent: (event) => {
        switch (event.type) {
          case 'chat':
            get().upsertChat(event.chat);
            return;
          case 'status':
            set((s) => applyStatus(s, event.chatId, event.id, event.status));
            return;
          case 'message':
            set((s) => applyMessage(s, event));
            return;
        }
      },

      reset: () => set(initialData()),
    }),
    {
      name: 'green-chat:data',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (k) => safeStorage.read('local', k),
        setItem: (k, v) => void safeStorage.write('local', k, v),
        removeItem: (k) => safeStorage.remove('local', k),
      })),
      merge: (persisted, current) => ({
        ...current,
        ...initialData(),
        ...(persisted as Partial<ChatsData> | undefined),
      }),
      partialize: ({ chats, messages, activeChatId }) => ({
        chats,
        messages: Object.fromEntries(
          Object.entries(messages).map(([id, list]) => [
            id,
            list.map((m) =>
              m.status === 'sending'
                ? { ...m, status: 'failed' as const, error: 'Отправка прервана' }
                : m,
            ),
          ]),
        ),
        activeChatId,
      }),
    },
  ),
);

export function isChatsStorageAttached(idInstance: string): boolean {
  return (
    useChatsStore.persist.getOptions().name === storageKey(idInstance) &&
    useChatsStore.persist.hasHydrated()
  );
}

export async function attachChatsStorage(idInstance: string): Promise<void> {
  if (isChatsStorageAttached(idInstance)) return;
  useChatsStore.persist.setOptions({ name: storageKey(idInstance) });
  await useChatsStore.persist.rehydrate();
}

export function clearChatsStorage(idInstance: string): void {
  useChatsStore.getState().reset();
  useChatsStore.persist.clearStorage();
  safeStorage.remove('local', storageKey(idInstance));
}

function applyStatus(
  s: ChatsData,
  chatId: string,
  id: string,
  status: MessageStatus,
): Partial<ChatsData> | ChatsData {
  const candidates = s.messages[chatId]
    ? [chatId, ...Object.keys(s.messages)]
    : Object.keys(s.messages);
  for (const key of candidates) {
    const list = updateMessage(s.messages[key], id, (m) =>
      canTransition(m.status, status)
        ? { ...m, status, error: status === 'failed' ? 'Сообщение не доставлено' : undefined }
        : m,
    );
    if (list) return { messages: { ...s.messages, [key]: list } };
    if (s.messages[key]?.some((m) => m.id === id)) return s;
  }
  return s;
}

function applyMessage(
  s: ChatsData,
  e: Extract<ChatEvent, { type: 'message' }>,
): Partial<ChatsData> | ChatsData {
  let { chats, messages, activeChatId } = s;

  // A chat opened by phone before checkAccount was available moves to the real chatId on first reply.
  if (!chats[e.chatId] && e.phone) {
    const legacy = Object.values(chats).find((c) => isPhoneChatId(c.chatId) && c.phone === e.phone);
    if (legacy) {
      const { [legacy.chatId]: _chat, ...restChats } = chats;
      const { [legacy.chatId]: legacyMessages = [], ...restMessages } = messages;
      chats = { ...restChats, [e.chatId]: { ...legacy, chatId: e.chatId } };
      messages = {
        ...restMessages,
        [e.chatId]: legacyMessages.map((m) => ({ ...m, chatId: e.chatId })),
      };
      if (activeChatId === legacy.chatId) activeChatId = e.chatId;
    }
  }

  const list = messages[e.chatId] ?? [];
  if (list.some((m) => m.id === e.id)) {
    return chats === s.chats ? s : { chats, messages, activeChatId };
  }

  const existing = chats[e.chatId];
  let chat: Chat = existing ?? {
    chatId: e.chatId,
    name: e.senderName || (e.phone ? `+${e.phone}` : 'Без имени'),
    phone: e.phone,
    unread: 0,
    createdAt: e.timestamp,
  };
  chat = touchChat(chat, e.timestamp);
  if (e.direction === 'in' && activeChatId !== e.chatId)
    chat = { ...chat, unread: chat.unread + 1 };
  if (!chat.phone && e.phone) chat = { ...chat, phone: e.phone };

  const msg: Message = {
    id: e.id,
    key: e.id,
    chatId: e.chatId,
    direction: e.direction,
    kind: e.kind,
    text: e.text,
    timestamp: e.timestamp,
    status: e.direction === 'out' ? 'sent' : undefined,
  };

  return {
    chats: { ...chats, [e.chatId]: chat },
    messages: { ...messages, [e.chatId]: insertSorted(list, msg) },
    activeChatId,
  };
}

const EMPTY: Message[] = [];

export const selectMessages = (chatId: string | null) => (s: ChatsState) =>
  (chatId && s.messages[chatId]) || EMPTY;

export const selectActiveChat = (s: ChatsState) =>
  s.activeChatId ? (s.chats[s.activeChatId] ?? null) : null;

export const selectTotalUnread = (s: ChatsState) =>
  Object.values(s.chats).reduce((sum, c) => sum + c.unread, 0);
