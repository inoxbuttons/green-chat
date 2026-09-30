import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cx } from '@/shared/lib/cx';
import { IconButton, SendIcon } from '@/shared/ui';
import { MESSAGE_MAX_LENGTH } from './useSendMessage';
import s from './Composer.module.css';

interface ComposerProps {
  onSend: (text: string) => void;
  /** Для сброса черновика и фокуса при смене чата. */
  chatId: string;
}

const MAX_HEIGHT_PX = 180;
const COUNTER_THRESHOLD = MESSAGE_MAX_LENGTH - 300;

export function Composer({ onSend, chatId }: ComposerProps) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim().length > 0;

  // Черновик — на каждый чат свой (сбрасывается при смене чата), фокус — в поле ввода.
  const [prevChat, setPrevChat] = useState(chatId);
  if (prevChat !== chatId) {
    setPrevChat(chatId);
    setText('');
  }
  useLayoutEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [chatId]);

  // Авто-высота textarea по содержимому.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
    ref.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter — отправить, Shift+Enter — перенос строки. Не мешаем IME-вводу.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className={s.composer}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={`composer-${chatId}`} className="visually-hidden">
        Сообщение
      </label>
      <textarea
        id={`composer-${chatId}`}
        ref={ref}
        rows={1}
        value={text}
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder="Сообщение"
        className={s.input}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {text.length > COUNTER_THRESHOLD && (
        <span className={s.counter} aria-live="polite">
          {MESSAGE_MAX_LENGTH - text.length}
        </span>
      )}
      <IconButton
        type="submit"
        size={32}
        variant="accent"
        aria-label="Отправить"
        className={cx(s.send, canSend && s.sendVisible)}
        disabled={!canSend}
        tabIndex={canSend ? 0 : -1}
      >
        <SendIcon size={20} />
      </IconButton>
    </form>
  );
}
