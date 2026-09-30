import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import s from './Banner.module.css';

interface BannerProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: 'info' | 'warning';
  className?: string;
}

export function Banner({
  icon,
  title,
  description,
  action,
  tone = 'info',
  className,
}: BannerProps) {
  return (
    <div role="status" className={cx(s.banner, s[tone], className)}>
      {icon && <span className={s.icon}>{icon}</span>}
      <div className={s.text}>
        <div className={s.title}>{title}</div>
        {description && <div className={s.description}>{description}</div>}
      </div>
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
