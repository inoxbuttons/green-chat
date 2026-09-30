export type MessageStatus = 'sending' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  key: string;
  chatId: string;
  direction: 'in' | 'out';
  kind: 'text' | 'unsupported';
  text: string;
  timestamp: number;
  status?: MessageStatus;
  error?: string;
}

export interface Chat {
  chatId: string;
  name: string;
  phone?: string;
  unread: number;
  createdAt: number;
  lastMessageAt?: number;
}

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

export function canTransition(from: MessageStatus | undefined, to: MessageStatus): boolean {
  if (!from) return true;
  if (to === 'failed') return STATUS_RANK[from] < STATUS_RANK.sent;
  return STATUS_RANK[to] > STATUS_RANK[from] || (from === 'failed' && to === 'sending');
}

export const isPhoneChatId = (chatId: string) => chatId.endsWith('@c.us');
export const phoneChatId = (phone: string) => `${phone}@c.us`;
