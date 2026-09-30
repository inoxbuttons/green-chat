import { cx } from '@/shared/lib/cx';
import { AlertIcon, CheckIcon } from './icons';
import { useToastStore } from './toast';
import s from './ToastViewport.module.css';

export function ToastViewport() {
  const toasts = useToastStore((st) => st.toasts);
  const dismiss = useToastStore((st) => st.dismiss);

  return (
    <div className={s.viewport} aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cx(s.toast, s[t.tone])}
          onClick={() => dismiss(t.id)}
        >
          {t.tone === 'error' && <AlertIcon size={18} className={s.icon} />}
          {t.tone === 'success' && <CheckIcon size={18} className={s.icon} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
