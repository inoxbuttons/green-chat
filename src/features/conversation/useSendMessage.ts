import { useCallback } from 'react';
import { describeError } from '@/api';
import { useClient } from '@/features/auth/session';
import { useChatsStore } from '@/features/chats/store';

export const MESSAGE_MAX_LENGTH = 4096;

export function useSendMessage() {
  const client = useClient();

  const deliver = useCallback(
    async (chatId: string, localId: string, text: string) => {
      const store = useChatsStore.getState();
      try {
        const idMessage = await client.sendMessage({ chatId, message: text });
        store.markQueued(chatId, localId, idMessage);
      } catch (e) {
        store.markFailed(chatId, localId, describeError(e));
      }
    },
    [client],
  );

  const send = useCallback(
    (chatId: string, raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const localId = useChatsStore
        .getState()
        .addOutgoing(chatId, text.slice(0, MESSAGE_MAX_LENGTH));
      void deliver(chatId, localId, text.slice(0, MESSAGE_MAX_LENGTH));
    },
    [deliver],
  );

  const retry = useCallback(
    (chatId: string, id: string) => {
      const msg = useChatsStore.getState().messages[chatId]?.find((m) => m.id === id);
      if (!msg || msg.status !== 'failed') return;
      useChatsStore.getState().setSending(chatId, id);
      void deliver(chatId, id, msg.text);
    },
    [deliver],
  );

  return { send, retry };
}
