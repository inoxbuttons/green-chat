import type { ButtonHTMLAttributes, Ref } from 'react';
import { cx } from '@/shared/lib/cx';
import s from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Обязателен: у кнопки-иконки нет видимого текста. */
  'aria-label': string;
  size?: 32 | 40;
  variant?: 'ghost' | 'accent';
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  size = 40,
  variant = 'ghost',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx(s.iconButton, s[variant], size === 32 ? s.s32 : s.s40, className)}
    />
  );
}
