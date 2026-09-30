import { useEffect } from 'react';
import { isGreenApiError } from '@/api';
import { useSessionStore } from '@/features/auth/session';
import { useInstanceStore } from './store';

const AUTHORIZED_INTERVAL_MS = 5 * 60_000;
const NOT_READY_INTERVAL_MS = 30_000;

/**
 * Следит за состоянием инстанса: при входе, по таймеру (чаще, пока инстанс
 * не авторизован), при возврате на вкладку и восстановлении сети.
 */
export function useInstanceMonitor(): void {
  const client = useSessionStore((s) => s.client);

  useEffect(() => {
    if (!client) return;
    const controller = new AbortController();
    const store = useInstanceStore.getState();
    let timer: number | undefined;
    let inFlight = false;

    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      window.clearTimeout(timer);
      try {
        const [state, settings] = await Promise.all([
          client.getStateInstance(controller.signal),
          client.getSettings(controller.signal),
        ]);
        store.setState(state);
        store.setSettings(settings);
      } catch (e) {
        if (controller.signal.aborted) return;
        if (isGreenApiError(e) && e.kind === 'auth') {
          useSessionStore.getState().signOut();
          return;
        }
      } finally {
        inFlight = false;
      }
      if (controller.signal.aborted) return;
      const next =
        useInstanceStore.getState().state === 'authorized'
          ? AUTHORIZED_INTERVAL_MS
          : NOT_READY_INTERVAL_MS;
      timer = window.setTimeout(refresh, next);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    void refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refresh);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refresh);
    };
  }, [client]);
}
