import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '@/shared/lib/cx';
import s from './TextField.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Подпись поля. Визуально показывается как placeholder, как на макете. */
  label: string;
  error?: string;
  hint?: string;
  /** Показывать счётчик «0/60» (нужен maxLength). */
  counter?: boolean;
  endAdornment?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  hint,
  counter,
  endAdornment,
  maxLength,
  value,
  className,
  id,
  placeholder,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-msg`;
  const length = typeof value === 'string' ? value.length : 0;
  const message = error ?? hint;

  return (
    <div className={cx(s.root, className)}>
      <div className={cx(s.field, error && s.invalid)}>
        <label htmlFor={inputId} className="visually-hidden">
          {label}
        </label>
        <input
          {...rest}
          id={inputId}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder ?? label}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={s.input}
        />
        {counter && maxLength !== undefined && (
          <span className={s.counter} aria-hidden>
            {length}/{maxLength}
          </span>
        )}
        {endAdornment}
      </div>
      <div
        id={messageId}
        className={cx(s.message, error && s.errorText)}
        role={error ? 'alert' : undefined}
      >
        {message}
      </div>
    </div>
  );
}
