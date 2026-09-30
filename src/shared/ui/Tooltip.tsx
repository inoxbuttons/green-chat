import { cloneElement, useEffect, useRef, type ReactElement, type Ref } from 'react';
import s from './Tooltip.module.css';
import { usePopover, type Placement } from './usePopover';

interface TooltipProps {
  label: string;
  placement?: Placement;
  children: ReactElement<{ ref?: Ref<HTMLElement>; 'aria-describedby'?: string }>;
}

const SHOW_DELAY_MS = 350;

export function Tooltip({ label, placement = 'right', children }: TooltipProps) {
  const { id, show, hide, anchorRef, popoverProps } = usePopover<HTMLElement>({
    placement,
    mode: 'manual',
  });
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const onEnter = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(show, SHOW_DELAY_MS);
    };
    const onLeave = () => {
      window.clearTimeout(timer.current);
      hide();
    };
    const onFocus = (e: FocusEvent) => {
      if ((e.target as HTMLElement).matches(':focus-visible')) show();
    };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onLeave);
    el.addEventListener('click', onLeave);
    return () => {
      window.clearTimeout(timer.current);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', onLeave);
      el.removeEventListener('click', onLeave);
    };
  }, [anchorRef, show, hide]);

  return (
    <>
      {cloneElement(children, { ref: anchorRef, 'aria-describedby': id })}
      <div {...popoverProps} role="tooltip" className={s.tooltip}>
        {label}
      </div>
    </>
  );
}
