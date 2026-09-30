import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { Message } from '@/features/chats/model';
import { cx } from '@/shared/lib/cx';
import { formatDayLabel, isSameDay } from '@/shared/lib/format';
import { ArrowDownIcon } from '@/shared/ui';
import { MessageBubble } from './MessageBubble';
import s from './MessageList.module.css';

interface MessageListProps {
  chatId: string;
  messages: Message[];
  instanceReady: boolean;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Насколько близко к низу считается «внизу» — тогда новые сообщения прокручиваются автоматически. */
const STICK_THRESHOLD_PX = 120;

export function MessageList({
  chatId,
  messages,
  instanceReady,
  onRetry,
  onDelete,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prevCountRef = useRef(0);
  const prevChatRef = useRef<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useLayoutEffect(() => {
    const chatChanged = prevChatRef.current !== chatId;
    const added = messages.length > prevCountRef.current;
    const last = messages.at(-1);
    prevChatRef.current = chatId;
    prevCountRef.current = messages.length;

    if (chatChanged) {
      scrollToBottom();
      atBottomRef.current = true;
    } else if (added && (atBottomRef.current || last?.direction === 'out')) {
      // Своё сообщение прокручиваем всегда, чужое — только если пользователь внизу.
      scrollToBottom('smooth');
    }
  }, [chatId, messages, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
    atBottomRef.current = atBottom;
    setShowScrollDown(!atBottom);
  };

  if (messages.length === 0) {
    return (
      <div className={s.emptyWrap}>
        <div className={s.emptyCard}>
          <h2 className={s.emptyTitle}>Сообщений пока нет</h2>
          <p className={s.emptyText}>Напишите сообщение, чтобы начать переписку</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div
        ref={scrollRef}
        className={s.scroll}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Сообщения"
      >
        <div className={s.column}>
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || !isSameDay(prev.timestamp, m.timestamp);
            return (
              <Fragment key={m.key}>
                {newDay && (
                  <div className={s.dayRow}>
                    <span className={s.day}>{formatDayLabel(m.timestamp)}</span>
                  </div>
                )}
                <MessageBubble
                  message={m}
                  first={newDay || prev?.direction !== m.direction}
                  animate={m.timestamp >= mountedAt}
                  instanceReady={instanceReady}
                  onRetry={onRetry}
                  onDelete={onDelete}
                />
              </Fragment>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        className={cx(s.scrollDown, showScrollDown && s.scrollDownVisible)}
        onClick={() => scrollToBottom('smooth')}
        aria-label="К последним сообщениям"
        tabIndex={showScrollDown ? 0 : -1}
      >
        <ArrowDownIcon size={20} />
      </button>
    </div>
  );
}
