import { useState } from 'react';
import { BellOffIcon, Button, LinkOffIcon, Banner, Spinner } from '@/shared/ui';
import { EnableNotificationsDialog } from './EnableNotificationsDialog';
import { useInstanceStore } from './store';

/**
 * Показывает самую важную проблему инстанса (одну за раз):
 * нет связи → Telegram не авторизован → выключены уведомления.
 */
export function StatusBanner({ className }: { className?: string }) {
  const state = useInstanceStore((s) => s.state);
  const incoming = useInstanceStore((s) => s.settings?.incomingWebhook);
  const receiving = useInstanceStore((s) => s.receiving);
  const [dialogOpen, setDialogOpen] = useState(false);

  let banner = null;
  if (!receiving) {
    banner = (
      <Banner
        className={className}
        tone="warning"
        icon={<Spinner size={18} />}
        title="Нет соединения с сервером"
        description="Переподключаемся… Новые сообщения появятся после восстановления связи."
      />
    );
  } else if (state && state !== 'authorized') {
    banner = (
      <Banner
        className={className}
        tone="warning"
        icon={<LinkOffIcon size={22} />}
        title="Telegram не авторизован"
        description="Сообщения встанут в очередь и уйдут после авторизации аккаунта в GREEN-API (хранятся 24 часа)."
      />
    );
  } else if (incoming === 'no') {
    banner = (
      <Banner
        className={className}
        icon={<BellOffIcon size={22} />}
        title="Получение сообщений выключено"
        description="Ответы собеседников не будут появляться в чате."
        action={
          <Button size="m" variant="ghost" onClick={() => setDialogOpen(true)}>
            Включить
          </Button>
        }
      />
    );
  }

  return (
    <>
      {banner}
      <EnableNotificationsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
