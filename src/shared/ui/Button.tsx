import type { ButtonHTMLAttributes, Ref } from 'react';
import { cx } from '@/shared/lib/cx';
import s from './Button.module.css';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'm' | 'l';
  block?: boolean;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  size = 'm',
  block,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(s.button, s[variant], s[size], block && s.block, className)}
    >
      {loading && <Spinner size={16} className={s.spinner} />}
      <span className={cx(s.label, loading && s.labelHidden)}>{children}</span>
    </button>
  );
}
