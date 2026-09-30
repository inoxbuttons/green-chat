import { describe, expect, it } from 'vitest';
import { parseNotification } from './parse';

const incoming = (messageData: object) => ({
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1700000000,
  idMessage: 'IN1',
  senderData: {
    chatId: '10000000',
    senderName: 'Наталия',
    senderContactName: '',
    senderPhoneNumber: 79123456789,
  },
  messageData,
});

describe('parseNotification', () => {
  it('входящее textMessage', () => {
    expect(
      parseNotification(
        incoming({ typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } }),
      ),
    ).toEqual({
      type: 'message',
      chatId: '10000000',
      id: 'IN1',
      direction: 'in',
      kind: 'text',
      text: 'Привет',
      timestamp: 1700000000000,
      senderName: 'Наталия',
      phone: '79123456789',
    });
  });

  it('extendedTextMessage читается из extendedTextMessageData.text', () => {
    const e = parseNotification(
      incoming({ typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'ссылка' } }),
    );
    expect(e).toMatchObject({ kind: 'text', text: 'ссылка' });
  });

  it('медиа → unsupported', () => {
    const e = parseNotification(incoming({ typeMessage: 'imageMessage' }));
    expect(e).toMatchObject({ type: 'message', kind: 'unsupported', text: '' });
  });

  it('outgoingAPIMessageReceived → исходящее', () => {
    const e = parseNotification({
      ...incoming({ typeMessage: 'textMessage', textMessageData: { textMessage: 'ok' } }),
      typeWebhook: 'outgoingAPIMessageReceived',
    });
    expect(e).toMatchObject({ direction: 'out', phone: undefined });
  });

  it.each([
    ['sent', 'sent'],
    ['delivered', 'delivered'],
    ['read', 'read'],
    ['noAccount', 'failed'],
    ['expired', 'failed'],
  ])('статус %s → %s', (status, expected) => {
    expect(
      parseNotification({
        typeWebhook: 'outgoingMessageStatus',
        timestamp: 1,
        idMessage: 'M',
        chatId: '1',
        status,
      } as never),
    ).toEqual({ type: 'status', chatId: '1', id: 'M', status: expected });
  });

  it('неизвестный тип → null', () => {
    expect(parseNotification({ typeWebhook: 'incomingCall', timestamp: 1 })).toBeNull();
  });
});
