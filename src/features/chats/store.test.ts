import { beforeEach, describe, expect, it } from 'vitest';
import type { ChatEvent } from './model';
import { canTransition } from './model';
import { attachChatsStorage, useChatsStore } from './store';

const store = () => useChatsStore.getState();

const incoming = (over: Partial<Extract<ChatEvent, { type: 'message' }>> = {}): ChatEvent => ({
  type: 'message',
  chatId: '100',
  id: 'm1',
  direction: 'in',
  kind: 'text',
  text: 'Привет',
  timestamp: 1_000,
  senderName: 'Наталия',
  phone: '79123456789',
  ...over,
});

beforeEach(async () => {
  store().reset();
  await attachChatsStorage(`test-${Math.random()}`);
});

describe('chats store', () => {
  it('создаёт чат из входящего сообщения и считает непрочитанные', () => {
    store().applyEvent(incoming());
    expect(store().chats['100']).toMatchObject({
      name: 'Наталия',
      unread: 1,
      phone: '79123456789',
    });
    expect(store().messages['100']).toHaveLength(1);
  });

  it('не дублирует сообщение с тем же idMessage', () => {
    store().applyEvent(incoming());
    store().applyEvent(incoming());
    expect(store().messages['100']).toHaveLength(1);
    expect(store().chats['100']!.unread).toBe(1);
  });

  it('открытие чата сбрасывает счётчик, входящие в открытый чат не считаются', () => {
    store().applyEvent(incoming());
    store().openChat('100');
    store().applyEvent(incoming({ id: 'm2', timestamp: 2_000 }));
    expect(store().chats['100']!.unread).toBe(0);
  });

  it('жизненный цикл исходящего: sending → queued → delivered → read', () => {
    store().upsertChat({ chatId: '100', name: 'Н' });
    const localId = store().addOutgoing('100', 'текст');
    expect(store().messages['100']![0]).toMatchObject({ status: 'sending' });

    store().markQueued('100', localId, 'API1');
    expect(store().messages['100']![0]).toMatchObject({
      id: 'API1',
      key: localId,
      status: 'queued',
    });

    store().applyEvent({ type: 'status', chatId: '100', id: 'API1', status: 'read' });
    store().applyEvent({ type: 'status', chatId: '100', id: 'API1', status: 'delivered' });
    expect(store().messages['100']![0]!.status).toBe('read');
  });

  it('уведомление пришло раньше ответа sendMessage — локальная копия удаляется', () => {
    store().upsertChat({ chatId: '100', name: 'Н' });
    const localId = store().addOutgoing('100', 'текст');
    store().applyEvent(
      incoming({ id: 'API1', direction: 'out', phone: undefined, timestamp: Date.now() }),
    );
    store().markQueued('100', localId, 'API1');
    expect(store().messages['100']).toHaveLength(1);
    expect(store().messages['100']![0]).toMatchObject({ id: 'API1', status: 'sent' });
  });

  it('переносит чат с номерным chatId на chatId Telegram при первом ответе', () => {
    store().upsertChat({ chatId: '79123456789@c.us', name: 'Наталия', phone: '79123456789' });
    store().openChat('79123456789@c.us');
    const localId = store().addOutgoing('79123456789@c.us', 'Привет');
    store().markQueued('79123456789@c.us', localId, 'API1');

    store().applyEvent(incoming({ chatId: '555', id: 'IN1', timestamp: Date.now() + 1 }));

    const s = store();
    expect(s.chats['79123456789@c.us']).toBeUndefined();
    expect(s.chats['555']).toMatchObject({ name: 'Наталия', unread: 0 });
    expect(s.messages['555']!.map((m) => m.id)).toEqual(['API1', 'IN1']);
    expect(s.activeChatId).toBe('555');
  });

  it('сохраняет порядок по времени при запоздавших уведомлениях', () => {
    store().applyEvent(incoming({ id: 'b', timestamp: 2_000 }));
    store().applyEvent(incoming({ id: 'a', timestamp: 1_000 }));
    expect(store().messages['100']!.map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('canTransition', () => {
  it('не откатывает статус назад и не помечает доставленное как failed', () => {
    expect(canTransition('read', 'delivered')).toBe(false);
    expect(canTransition('delivered', 'failed')).toBe(false);
    expect(canTransition('queued', 'failed')).toBe(true);
    expect(canTransition('failed', 'sending')).toBe(true);
  });
});
