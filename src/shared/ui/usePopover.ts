import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

export type Placement = 'bottom-start' | 'bottom-end' | 'right' | 'top-start';

const GAP = 6;
const VIEWPORT_PADDING = 8;

export function computePosition(
  anchor: DOMRect,
  pop: { width: number; height: number },
  placement: Placement,
  viewport = { width: window.innerWidth, height: window.innerHeight },
): { top: number; left: number } {
  let top: number;
  let left: number;
  switch (placement) {
    case 'right':
      top = anchor.top + anchor.height / 2 - pop.height / 2;
      left = anchor.right + GAP;
      break;
    case 'bottom-end':
      top = anchor.bottom + GAP;
      left = anchor.right - pop.width;
      break;
    case 'top-start':
      top = anchor.top - GAP - pop.height;
      left = anchor.left;
      break;
    case 'bottom-start':
    default:
      top = anchor.bottom + GAP;
      left = anchor.left;
  }
  if (placement.startsWith('bottom') && top + pop.height > viewport.height - VIEWPORT_PADDING) {
    const flipped = anchor.top - GAP - pop.height;
    if (flipped >= VIEWPORT_PADDING) top = flipped;
  }
  const clamp = (v: number, max: number) =>
    Math.max(VIEWPORT_PADDING, Math.min(v, max - VIEWPORT_PADDING));
  return {
    top: clamp(top, viewport.height - pop.height),
    left: clamp(left, viewport.width - pop.width),
  };
}

interface UsePopoverOptions {
  placement?: Placement;
  mode?: 'auto' | 'manual';
  onOpenChange?: (open: boolean) => void;
}

export function usePopover<A extends HTMLElement = HTMLButtonElement>({
  placement = 'bottom-start',
  mode = 'auto',
  onOpenChange,
}: UsePopoverOptions = {}) {
  const id = useId();
  const anchorRef = useRef<A>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const position = useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popoverRef.current;
    if (!anchor || !pop) return;
    const { top, left } = computePosition(
      anchor.getBoundingClientRect(),
      { width: pop.offsetWidth, height: pop.offsetHeight },
      placement,
    );
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
  }, [placement]);

  useEffect(() => {
    const pop = popoverRef.current;
    if (!pop) return;
    const onToggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === 'open';
      if (isOpen) position();
      setOpen(isOpen);
      onOpenChangeRef.current?.(isOpen);
    };
    const onBeforeToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === 'open') requestAnimationFrame(position);
    };
    pop.addEventListener('toggle', onToggle);
    pop.addEventListener('beforetoggle', onBeforeToggle);
    return () => {
      pop.removeEventListener('toggle', onToggle);
      pop.removeEventListener('beforetoggle', onBeforeToggle);
    };
  }, [position]);

  useEffect(() => {
    if (!open) return;
    const close = () => popoverRef.current?.hidePopover();
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open]);

  const show = useCallback(() => {
    const pop = popoverRef.current;
    if (pop && !pop.matches(':popover-open')) {
      pop.showPopover();
      position();
    }
  }, [position]);

  const hide = useCallback(() => {
    const pop = popoverRef.current;
    if (pop?.matches(':popover-open')) pop.hidePopover();
  }, []);

  return {
    id,
    open,
    show,
    hide,
    anchorRef,
    popoverRef,
    popoverProps: { id, ref: popoverRef, popover: mode } as const,
  };
}
