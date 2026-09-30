import { describe, expect, it, vi } from 'vitest';
import { GreenApiError, type GreenApiClient, type Notification } from '@/api';
import { backoffDelay, MIN_EMPTY_POLL_INTERVAL_MS, runNotificationLoop } from './poller';

function fakeClient(queue: Array<Notification | null | Error>, controller: AbortController) {
  const deleted: number[] = [];
  const client = {
    receiveNotification: vi.fn(async () => {
      const next = queue.shift();
      if (next === undefined) {
        controller.abort();
        return null;
      }
      if (next instanceof Error) throw next;
      return next;
    }),
    deleteNotification: vi.fn(async (id: number) => {
      deleted.push(id);
    }),
  };
  return { client: client as unknown as GreenApiClient, deleted, raw: client };
}

const text = (receiptId: number, id: string): Notification => ({
  receiptId,
  body: {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1,
    idMessage: id,
    senderData: { chatId: '1' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: id } },
  } as never,
});

describe('runNotificationLoop', () => {
  it('обрабатывает и удаляет каждое уведомление, включая неподдерживаемые', async () => {
    const controller = new AbortController();
    const { client, deleted } = fakeClient(
      [text(1, 'a'), { receiptId: 2, body: { typeWebhook: 'incomingCall' } }, null, text(3, 'b')],
      controller,
    );
    const onEvent = vi.fn();
    await runNotificationLoop(client, { onEvent }, controller.signal, async () => {});
    expect(deleted).toEqual([1, 2, 3]);
    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('удаляет уведомление, даже если обработчик упал', async () => {
    const controller = new AbortController();
    const { client, deleted } = fakeClient([text(7, 'x')], controller);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runNotificationLoop(
      client,
      {
        onEvent: () => {
          throw new Error('boom');
        },
      },
      controller.signal,
      async () => {},
    );
    expect(deleted).toEqual([7]);
    spy.mockRestore();
  });

  it('после сетевых ошибок ждёт с экспоненциальной задержкой и продолжает', async () => {
    const controller = new AbortController();
    const net = () => new GreenApiError('network', 'x');
    const { client, deleted } = fakeClient([net(), net(), text(1, 'a')], controller);
    const sleeps: number[] = [];
    const onHealthChange = vi.fn();
    await runNotificationLoop(
      client,
      { onEvent: () => {}, onHealthChange },
      controller.signal,
      async (ms) => {
        sleeps.push(ms);
      },
    );
    expect(sleeps).toEqual([backoffDelay(1), backoffDelay(2)]);
    expect(onHealthChange.mock.calls).toEqual([[false], [true]]);
    expect(deleted).toEqual([1]);
  });

  it('ошибка auth останавливает цикл', async () => {
    const controller = new AbortController();
    const { client, raw } = fakeClient(
      [new GreenApiError('auth', 'x', { status: 401 }), text(1, 'a')],
      controller,
    );
    const onFatal = vi.fn();
    await runNotificationLoop(
      client,
      { onEvent: () => {}, onFatal },
      controller.signal,
      async () => {},
    );
    expect(onFatal).toHaveBeenCalledOnce();
    expect(raw.receiveNotification).toHaveBeenCalledTimes(1);
  });

  it('мгновенный пустой ответ не превращается в частый опрос', async () => {
    const controller = new AbortController();
    const { client } = fakeClient([null, text(1, 'a')], controller);
    const sleeps: number[] = [];
    await runNotificationLoop(
      client,
      { onEvent: () => {} },
      controller.signal,
      async (ms) => {
        sleeps.push(ms);
      },
      () => 1_000,
    );
    expect(sleeps[0]).toBe(MIN_EMPTY_POLL_INTERVAL_MS);
  });

  it('stateInstanceChanged передаётся в onInstanceState', async () => {
    const controller = new AbortController();
    const { client } = fakeClient(
      [
        {
          receiptId: 1,
          body: {
            typeWebhook: 'stateInstanceChanged',
            timestamp: 1,
            stateInstance: 'authorized',
          } as never,
        },
      ],
      controller,
    );
    const onInstanceState = vi.fn();
    await runNotificationLoop(
      client,
      { onEvent: () => {}, onInstanceState },
      controller.signal,
      async () => {},
    );
    expect(onInstanceState).toHaveBeenCalledWith('authorized');
  });
});
