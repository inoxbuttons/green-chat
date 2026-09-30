import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import s from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Запретить закрытие (например, пока идёт запрос). */
  dismissible?: boolean;
  size?: 's' | 'm';
  className?: string;
}

/**
 * Модальное окно на нативном <dialog>: top layer, фокус-ловушка, Esc
 * и возврат фокуса обеспечивает браузер. Анимации — на CSS.
 */
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
      // showModal() фокусирует первый фокусируемый элемент (например, выбор страны);
      // нам нужно первое поле ввода или элемент, помеченный data-autofocus.
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

  // Esc: браузер закрывает <dialog> сам — перехватываем, чтобы состояние оставалось у родителя.
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
      // Клик по подложке: считаем, только если и нажатие, и отпускание были вне контента,
      // иначе выделение текста с выходом за край закрывало бы окно.
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
