import { cx } from '@/shared/lib/cx';
import s from './Spinner.module.css';

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx(s.spinner, className)}
      style={{ width: size, height: size }}
      role="presentation"
    />
  );
}
