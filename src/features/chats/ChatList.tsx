import { memo, useMemo, useState } from 'react';
import { cx } from '@/shared/lib/cx';
import { formatListTime } from '@/shared/lib/format';
import { Avatar, IconButton, Menu, MenuItem, PlusIcon, Tooltip } from '@/shared/ui';
import { AddContactDialog } from './AddContactDialog';
import type { Chat, Message } from './model';
import { useChatsStore } from './store';
import s from './ChatList.module.css';

interface ChatListProps {
  /** Компактный режим (только аватары) — когда открыт чат, как на макете. */
  compact: boolean;
}

export function ChatList({ compact }: ChatListProps) {
  const chats = useChatsStore((st) => st.chats);
  const messages = useChatsStore((st) => st.messages);
  const activeChatId = useChatsStore((st) => st.activeChatId);
  const openChat = useChatsStore((st) => st.openChat);
  const [addOpen, setAddOpen] = useState(false);

  const sorted = useMemo(
    () =>
      Object.values(chats).sort(
        (a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt),
      ),
    [chats],
  );

  return (
    <section className={cx(s.root, compact && s.compact)} aria-label="Чаты">
      <header className={s.header}>
        <Menu
          aria-label="Создать"
          trigger={(props) => (
            <IconButton
              {...props}
              variant="accent"
              size={32}
              aria-label="Создать"
              className={s.plus}
            >
              <PlusIcon size={20} strokeWidth={2.4} />
            </IconButton>
          )}
        >
          <MenuItem icon={<PlusIcon size={20} />} onClick={() => setAddOpen(true)}>
            Добавить контакт
          </MenuItem>
        </Menu>
        <h1 className={s.title}>Чаты</h1>
      </header>

      {sorted.length === 0 ? (
        !compact && (
          <div className={s.empty}>
            <p className={s.emptyTitle}>Чатов пока нет</p>
            <p className={s.emptyText}>
              Нажмите <span className={s.inlinePlus}>+</span>, чтобы добавить контакт по номеру
              телефона и начать переписку.
            </p>
          </div>
        )
      ) : (
        <ul className={s.list} role="list">
          {sorted.map((chat) => (
            <li key={chat.chatId}>
              <ChatListItem
                chat={chat}
                last={messages[chat.chatId]?.at(-1)}
                active={chat.chatId === activeChatId}
                compact={compact}
                onOpen={openChat}
              />
            </li>
          ))}
        </ul>
      )}

      <AddContactDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </section>
  );
}

interface ItemProps {
  chat: Chat;
  last?: Message;
  active: boolean;
  compact: boolean;
  onOpen: (chatId: string) => void;
}

const ChatListItem = memo(function ChatListItem({
  chat,
  last,
  active,
  compact,
  onOpen,
}: ItemProps) {
  const preview = !last
    ? 'Нет сообщений'
    : last.kind === 'unsupported'
      ? 'Сообщение не поддерживается'
      : `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}`;
  const unreadLabel = chat.unread ? `, ${chat.unread} непрочитанных` : '';

  const button = (
    <button
      type="button"
      className={cx(s.item, active && s.active)}
      aria-current={active ? 'true' : undefined}
      aria-label={compact ? `${chat.name}${unreadLabel}` : undefined}
      onClick={() => onOpen(chat.chatId)}
    >
      <span className={s.avatarWrap}>
        <Avatar name={chat.name} seed={chat.chatId} size={48} />
        {compact && chat.unread > 0 && (
          <span className={s.dotBadge}>{chat.unread > 99 ? '99+' : chat.unread}</span>
        )}
      </span>
      {!compact && (
        <span className={s.body}>
          <span className={s.row}>
            <span className={s.name}>{chat.name}</span>
            {last && <time className={s.time}>{formatListTime(last.timestamp)}</time>}
          </span>
          <span className={s.row}>
            <span className={cx(s.preview, last?.kind === 'unsupported' && s.previewMuted)}>
              {preview}
            </span>
            {chat.unread > 0 && (
              <span className={s.badge} aria-label={`${chat.unread} непрочитанных`}>
                {chat.unread > 99 ? '99+' : chat.unread}
              </span>
            )}
          </span>
        </span>
      )}
    </button>
  );

  return compact ? <Tooltip label={chat.name}>{button}</Tooltip> : button;
});
