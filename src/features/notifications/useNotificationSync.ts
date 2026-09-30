import { useEffect } from 'react';
import type { InstanceState } from '@/api';
import { useSessionStore } from '@/features/auth/session';
import type { ChatEvent } from '@/features/chats/model';
import { useChatsStore } from '@/features/chats/store';
import { useInstanceStore } from '@/features/instance/store';
import { toast } from '@/shared/ui';
import { runNotificationLoop } from './poller';
import { runWhileLeader } from './tabLeader';

type SyncMessage = { kind: 'event'; event: ChatEvent } | { kind: 'state'; state: InstanceState };

let channel: BroadcastChannel | null = null;

/** Рассылает локальное событие (например, созданный чат) другим вкладкам. */
export function broadcastEvent(event: ChatEvent): void {
  channel?.postMessage({ kind: 'event', event } satisfies SyncMessage);
}

/**
 * Запускает получение уведомлений для текущей сессии:
 * одна вкладка-лидер опрашивает API и транслирует события остальным.
 */
export function useNotificationSync(): void {
  const client = useSessionStore((s) => s.client);

  useEffect(() => {
    if (!client) return;
    const controller = new AbortController();
    const applyEvent = useChatsStore.getState().applyEvent;
    const setState = useInstanceStore.getState().setState;

    channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(`green-chat:${client.idInstance}`)
        : null;
    channel?.addEventListener('message', (e: MessageEvent<SyncMessage>) => {
      if (e.data.kind === 'event') applyEvent(e.data.event);
      else if (e.data.kind === 'state') setState(e.data.state);
    });

    runWhileLeader(
      `green-chat:poll:${client.idInstance}`,
      (signal) =>
        runNotificationLoop(
          client,
          {
            onEvent: (event) => {
              applyEvent(event);
              channel?.postMessage({ kind: 'event', event } satisfies SyncMessage);
            },
            onInstanceState: (state) => {
              setState(state);
              channel?.postMessage({ kind: 'state', state } satisfies SyncMessage);
            },
            onHealthChange: (healthy) => useInstanceStore.getState().setReceiving(healthy),
            onFatal: () => {
              toast.error('Сессия недействительна: проверьте apiTokenInstance.');
              useSessionStore.getState().signOut();
            },
          },
          signal,
        ),
      controller.signal,
    );

    return () => {
      controller.abort();
      channel?.close();
      channel = null;
    };
  }, [client]);
}
