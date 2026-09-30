import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import s from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  dismissible?: boolean;
  size?: 's' | 'm';
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissible = true,
  size = 'm',
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        [
          ...dialog.querySelectorAll<HTMLElement>(
            'input:not([disabled]), textarea:not([disabled])',
          ),
        ].find((el) => el.offsetParent !== null);
      target?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      if (dismissible) onClose();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [dismissible, onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cx(s.dialog, s[size], className)}
      // Close only if the press also started on the backdrop, so text-selection drags don't dismiss.
      onPointerDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (dismissible && pressStartedOnBackdrop.current && e.target === e.currentTarget)
          onClose();
        pressStartedOnBackdrop.current = false;
      }}
    >
      <div className={s.content}>
        <h2 id={titleId} className={s.title}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
