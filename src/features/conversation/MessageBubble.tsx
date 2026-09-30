import { memo } from 'react';
import type { Message } from '@/features/chats/model';
import { cx } from '@/shared/lib/cx';
import { formatTime } from '@/shared/lib/format';
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from '@/shared/ui';
import s from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
  first: boolean;
  animate: boolean;
  instanceReady: boolean;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

function StatusIcon({
  status,
  instanceReady,
}: {
  status: Message['status'];
  instanceReady: boolean;
}) {
  switch (status) {
    case 'sending':
      return <ClockIcon size={14} aria-label="Отправляется" role="img" />;
    case 'queued':
      return instanceReady ? (
        <CheckIcon size={15} aria-label="Отправлено" role="img" />
      ) : (
        <span
          title="В очереди: отправится после авторизации Telegram (до 24 часов)"
          className={s.queued}
        >
          <ClockIcon size={14} aria-label="В очереди на отправку" role="img" />
        </span>
      );
    case 'sent':
      return <CheckIcon size={15} aria-label="Отправлено" role="img" />;
    case 'delivered':
      return <DoubleCheckIcon size={16} aria-label="Доставлено" role="img" />;
    case 'read':
      return <DoubleCheckIcon size={16} aria-label="Прочитано" role="img" className={s.read} />;
    case 'failed':
      return <AlertIcon size={15} aria-label="Не отправлено" role="img" className={s.failedIcon} />;
    default:
      return null;
  }
}

export const MessageBubble = memo(function MessageBubble({
  message,
  first,
  animate,
  instanceReady,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const out = message.direction === 'out';
  const failed = message.status === 'failed';

  return (
    <div className={cx(s.row, out ? s.out : s.in, first && s.first)}>
      <div className={cx(s.bubble, animate && s.animate, failed && s.failed)}>
        {message.kind === 'unsupported' ? (
          <p className={cx(s.text, s.unsupported)}>Сообщение этого типа не поддерживается</p>
        ) : (
          <p className={s.text}>{message.text}</p>
        )}
        <div className={s.meta}>
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
          {out && <StatusIcon status={message.status} instanceReady={instanceReady} />}
        </div>
      </div>
      {failed && (
        <div className={s.failedActions}>
          <span>{message.error ?? 'Не отправлено'}</span>
          <button type="button" onClick={() => onRetry(message.id)}>
            Повторить
          </button>
          <button type="button" onClick={() => onDelete(message.id)}>
            Удалить
          </button>
        </div>
      )}
    </div>
  );
});
