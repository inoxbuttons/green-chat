import { abortableSleep, isGreenApiError, type GreenApiClient, type InstanceState } from '@/api';
import type { StateWebhook } from '@/api/types';
import type { ChatEvent } from '@/features/chats/model';
import { parseNotification } from './parse';

export interface PollerHandlers {
  onEvent: (event: ChatEvent) => void;
  onInstanceState?: (state: InstanceState) => void;
  onFatal?: (error: unknown) => void;
  onHealthChange?: (healthy: boolean) => void;
}

const MAX_BACKOFF_MS = 30_000;

// An unauthorized instance returns immediately instead of holding the long poll.
export const MIN_EMPTY_POLL_INTERVAL_MS = 5_000;

export const backoffDelay = (failures: number) =>
  Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.max(0, failures - 1));

export async function runNotificationLoop(
  client: GreenApiClient,
  handlers: PollerHandlers,
  signal: AbortSignal,
  sleep: (ms: number, signal?: AbortSignal) => Promise<void> = abortableSleep,
  now: () => number = Date.now,
): Promise<void> {
  let failures = 0;
  const fail = async (e: unknown) => {
    failures++;
    if (failures === 2) handlers.onHealthChange?.(false);
    const retryAfter = isGreenApiError(e) ? e.retryAfterMs : undefined;
    await sleep(retryAfter ?? backoffDelay(failures), signal).catch(() => {});
  };
  const succeed = () => {
    if (failures >= 2) handlers.onHealthChange?.(true);
    failures = 0;
  };

  while (!signal.aborted) {
    let notification;
    const startedAt = now();
    try {
      notification = await client.receiveNotification(signal);
      succeed();
    } catch (e) {
      if (signal.aborted) break;
      if (isGreenApiError(e) && e.kind === 'auth') {
        handlers.onFatal?.(e);
        break;
      }
      await fail(e);
      continue;
    }
    if (!notification) {
      if (signal.aborted) break;
      const elapsed = now() - startedAt;
      if (elapsed < MIN_EMPTY_POLL_INTERVAL_MS) {
        await sleep(MIN_EMPTY_POLL_INTERVAL_MS - elapsed, signal).catch(() => {});
      }
      continue;
    }

    try {
      const { body } = notification;
      if (body.typeWebhook === 'stateInstanceChanged') {
        handlers.onInstanceState?.((body as StateWebhook).stateInstance);
      } else {
        const event = parseNotification(body);
        if (event) handlers.onEvent(event);
      }
    } catch (e) {
      console.error('Failed to handle notification', notification.receiptId, e);
    }

    // Always ack: the queue is FIFO, so an unacked notification blocks everything after it.
    try {
      await client.deleteNotification(notification.receiptId, signal);
    } catch (e) {
      if (signal.aborted) break;
      await fail(e);
    }
  }
}
