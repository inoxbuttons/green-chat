import type { MessageWebhook, OutgoingStatus, StatusWebhook, WebhookBody } from '@/api';
import type { ChatEvent, MessageStatus } from '@/features/chats/model';

const STATUS_MAP: Record<OutgoingStatus, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
  yellowCard: 'failed',
  expired: 'failed',
};

const MESSAGE_WEBHOOKS = new Set([
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived',
]);

function extractText(data: MessageWebhook['messageData']): string | null {
  switch (data.typeMessage) {
    case 'textMessage':
      return data.textMessageData?.textMessage ?? data.extendedTextMessageData?.text ?? null;
    case 'extendedTextMessage':
    case 'quotedMessage':
      return data.extendedTextMessageData?.text ?? data.textMessageData?.textMessage ?? null;
    default:
      return null;
  }
}

export function parseNotification(body: WebhookBody): ChatEvent | null {
  if (MESSAGE_WEBHOOKS.has(body.typeWebhook)) {
    const m = body as MessageWebhook;
    if (!m.senderData?.chatId || !m.idMessage || !m.messageData) return null;
    const text = extractText(m.messageData);
    const phone = m.senderData.senderPhoneNumber;
    return {
      type: 'message',
      chatId: m.senderData.chatId,
      id: m.idMessage,
      direction: m.typeWebhook === 'incomingMessageReceived' ? 'in' : 'out',
      kind: text === null ? 'unsupported' : 'text',
      text: text ?? '',
      timestamp: (m.timestamp || Date.now() / 1000) * 1000,
      senderName:
        m.typeWebhook === 'incomingMessageReceived'
          ? m.senderData.senderContactName || m.senderData.senderName || m.senderData.chatName
          : m.senderData.chatName,
      phone: m.typeWebhook === 'incomingMessageReceived' && phone ? String(phone) : undefined,
    };
  }

  if (body.typeWebhook === 'outgoingMessageStatus') {
    const st = body as StatusWebhook;
    const status = STATUS_MAP[st.status];
    if (!status || !st.idMessage) return null;
    return { type: 'status', chatId: st.chatId, id: st.idMessage, status };
  }

  return null;
}
