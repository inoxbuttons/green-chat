export type MessageStatus = 'sending' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  /** idMessage из GREEN-API, либо локальный id до подтверждения отправки. */
  id: string;
  /** Стабильный ключ для React: не меняется при замене локального id на idMessage. */
  key: string;
  chatId: string;
  direction: 'in' | 'out';
  kind: 'text' | 'unsupported';
  text: string;
  /** Unix time, мс. */
  timestamp: number;
  status?: MessageStatus;
  error?: string;
}

export interface Chat {
  chatId: string;
  name: string;
  /** E.164 без «+», если известен. */
  phone?: string;
  unread: number;
  createdAt: number;
  lastMessageAt?: number;
}

/** Нормализованное событие домена — результат разбора уведомления GREEN-API. */
export type ChatEvent =
  | {
      type: 'message';
      chatId: string;
      id: string;
      direction: 'in' | 'out';
      kind: 'text' | 'unsupported';
      text: string;
      timestamp: number;
      senderName?: string;
      phone?: string;
    }
  | { type: 'status'; chatId: string; id: string; status: MessageStatus }
  | { type: 'chat'; chat: Pick<Chat, 'chatId' | 'name' | 'phone'> };

const STATUS_RANK: Record<MessageStatus, number> = {
  sending: 0,
  queued: 1,
  failed: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

/**
 * Статусы приходят асинхронно и могут перепутаться порядком:
 * «read» не должен откатиться до «delivered», а «failed» не перекрывает доставленное.
 */
export function canTransition(from: MessageStatus | undefined, to: MessageStatus): boolean {
  if (!from) return true;
  if (to === 'failed') return STATUS_RANK[from] < STATUS_RANK.sent;
  return STATUS_RANK[to] > STATUS_RANK[from] || (from === 'failed' && to === 'sending');
}

export const isPhoneChatId = (chatId: string) => chatId.endsWith('@c.us');
export const phoneChatId = (phone: string) => `${phone}@c.us`;
