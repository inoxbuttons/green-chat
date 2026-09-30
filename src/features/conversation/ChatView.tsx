import { useCallback } from 'react';
import type { Chat } from '@/features/chats/model';
import { selectMessages, useChatsStore } from '@/features/chats/store';
import { StatusBanner } from '@/features/instance/StatusBanner';
import { useInstanceStore } from '@/features/instance/store';
import { formatInternational } from '@/shared/lib/phone';
import { ArrowLeftIcon, Avatar, IconButton } from '@/shared/ui';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { useSendMessage } from './useSendMessage';
import s from './ChatView.module.css';

export function ChatView({ chat }: { chat: Chat }) {
  const messages = useChatsStore(selectMessages(chat.chatId));
  const openChat = useChatsStore((st) => st.openChat);
  const removeMessage = useChatsStore((st) => st.removeMessage);
  const instanceReady = useInstanceStore((st) => st.state === 'authorized');
  const { send, retry } = useSendMessage();

  const onSend = useCallback((text: string) => send(chat.chatId, text), [send, chat.chatId]);
  const onRetry = useCallback((id: string) => retry(chat.chatId, id), [retry, chat.chatId]);
  const onDelete = useCallback(
    (id: string) => removeMessage(chat.chatId, id),
    [removeMessage, chat.chatId],
  );

  return (
    <section className={s.view} aria-label={`Чат: ${chat.name}`}>
      <header className={s.header}>
        <IconButton aria-label="Назад к списку чатов" onClick={() => openChat(null)}>
          <ArrowLeftIcon size={24} />
        </IconButton>
        <Avatar name={chat.name} seed={chat.chatId} size={40} />
        <div className={s.titles}>
          <h2 className={s.name}>{chat.name}</h2>
          <p className={s.status}>{chat.phone ? formatInternational(chat.phone) : 'Telegram'}</p>
        </div>
      </header>

      <div className={`${s.body} wallpaper`}>
        <div className={s.bannerSlot}>
          <StatusBanner className={s.banner} />
        </div>
        <MessageList
          key={chat.chatId}
          chatId={chat.chatId}
          messages={messages}
          instanceReady={instanceReady}
          onRetry={onRetry}
          onDelete={onDelete}
        />
        <div className={s.composerSlot}>
          <Composer chatId={chat.chatId} onSend={onSend} />
        </div>
      </div>
    </section>
  );
}
