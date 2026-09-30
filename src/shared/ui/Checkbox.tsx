import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import { CheckIcon } from './icons';
import s from './Checkbox.module.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ children, description, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(s.root, className)}>
      <input {...rest} type="checkbox" className={s.input} />
      <span className={s.box} aria-hidden>
        <CheckIcon size={14} strokeWidth={3} />
      </span>
      <span className={s.text}>
        <span>{children}</span>
        {description && <span className={s.description}>{description}</span>}
      </span>
    </label>
  );
}
