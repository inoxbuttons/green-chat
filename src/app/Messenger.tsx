import { useEffect, useState } from 'react';
import { useSessionStore } from '@/features/auth/session';
import { ChatList } from '@/features/chats/ChatList';
import {
  attachChatsStorage,
  isChatsStorageAttached,
  selectActiveChat,
  selectTotalUnread,
  useChatsStore,
} from '@/features/chats/store';
import { ChatView } from '@/features/conversation/ChatView';
import { useInstanceMonitor } from '@/features/instance/useInstanceMonitor';
import { useNotificationSync } from '@/features/notifications/useNotificationSync';
import { SettingsPanel } from '@/features/settings/SettingsPanel';
import { cx } from '@/shared/lib/cx';
import { Spinner } from '@/shared/ui';
import { EmptyMain } from './EmptyMain';
import { NavRail } from './NavRail';
import { useUiStore } from './uiStore';
import s from './Messenger.module.css';

const APP_TITLE = 'Green Chat';

export function Messenger() {
  const idInstance = useSessionStore((st) => st.session!.idInstance);
  const [ready, setReady] = useState(() => isChatsStorageAttached(idInstance));

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void attachChatsStorage(idInstance).then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [idInstance, ready]);

  if (!ready) {
    return (
      <div className={s.loading}>
        <Spinner size={28} />
      </div>
    );
  }
  return <MessengerLayout />;
}

function MessengerLayout() {
  useNotificationSync();
  useInstanceMonitor();
  useDocumentTitle();

  const section = useUiStore((st) => st.section);
  const activeChat = useChatsStore(selectActiveChat);
  const chatOpen = activeChat !== null;
  const compact = section === 'chats' && chatOpen;

  return (
    <div className={cx(s.layout, chatOpen && s.chatOpen)}>
      <NavRail className={s.rail} />
      <aside className={cx(s.sidebar, compact && s.compact)}>
        {section === 'chats' ? <ChatList compact={compact} /> : <SettingsPanel />}
      </aside>
      <main className={s.main}>{activeChat ? <ChatView chat={activeChat} /> : <EmptyMain />}</main>
    </div>
  );
}

function useDocumentTitle() {
  const unread = useChatsStore(selectTotalUnread);
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${APP_TITLE}` : APP_TITLE;
  }, [unread]);
}
