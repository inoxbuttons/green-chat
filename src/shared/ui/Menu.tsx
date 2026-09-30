import {
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { cx } from '@/shared/lib/cx';
import s from './Menu.module.css';
import { usePopover, type Placement } from './usePopover';

export interface MenuTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  popoverTarget: string;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string;
}

interface MenuProps {
  trigger: (props: MenuTriggerProps) => ReactNode;
  children: ReactNode;
  placement?: Placement;
  'aria-label': string;
  className?: string;
}

const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';

export function Menu({ trigger, children, placement, className, ...aria }: MenuProps) {
  const { id, open, anchorRef, popoverProps } = usePopover({
    placement,
    onOpenChange: (isOpen) => {
      if (isOpen) {
        requestAnimationFrame(() =>
          popoverProps.ref.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus(),
        );
      }
    },
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusAt(current + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusAt(current - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      case 'Tab':
        popoverProps.ref.current?.hidePopover();
        break;
    }
  };

  return (
    <>
      {trigger({
        ref: anchorRef,
        popoverTarget: id,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': id,
      })}
      <div
        {...popoverProps}
        role="menu"
        aria-label={aria['aria-label']}
        className={cx(s.menu, className)}
        onKeyDown={onKeyDown}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(ITEM_SELECTOR)) e.currentTarget.hidePopover();
        }}
      >
        {children}
      </div>
    </>
  );
}

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  tone?: 'default' | 'danger';
}

export function MenuItem({ icon, tone = 'default', children, className, ...rest }: MenuItemProps) {
  return (
    <button
      {...rest}
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={cx(s.item, tone === 'danger' && s.danger, className)}
    >
      {icon && <span className={s.icon}>{icon}</span>}
      <span className={s.label}>{children}</span>
    </button>
  );
}
