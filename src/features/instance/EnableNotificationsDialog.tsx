import { useState } from 'react';
import { describeError } from '@/api';
import { useClient } from '@/features/auth/session';
import { Button, Modal, toast } from '@/shared/ui';
import { REQUIRED_NOTIFICATION_SETTINGS, useInstanceStore } from './store';
import s from './dialogs.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EnableNotificationsDialog({ open, onClose }: Props) {
  const client = useClient();
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      await client.setSettings(REQUIRED_NOTIFICATION_SETTINGS);
      const store = useInstanceStore.getState();
      store.setSettings({ ...store.settings, ...REQUIRED_NOTIFICATION_SETTINGS });
      toast.success('Настройки сохранены. Они вступят в силу в течение нескольких минут.');
      onClose();
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Включить получение сообщений?"
      size="s"
      dismissible={!loading}
    >
      <p className={s.text}>В настройках инстанса GREEN-API будут включены уведомления:</p>
      <ul className={s.list}>
        <li>входящие сообщения;</li>
        <li>сообщения, отправленные с телефона и через API;</li>
        <li>статусы доставки и состояние инстанса.</li>
      </ul>
      <p className={s.note}>Без них ответы собеседников не появятся в чате.</p>
      <div className={s.actions}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={enable} loading={loading}>
          Включить
        </Button>
      </div>
    </Modal>
  );
}
