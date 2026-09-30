import { useState } from 'react';
import { logout } from '@/features/auth/logout';
import { useSessionStore } from '@/features/auth/session';
import { EnableNotificationsDialog } from '@/features/instance/EnableNotificationsDialog';
import {
  INSTANCE_STATE_LABEL,
  missingNotificationSettings,
  useInstanceStore,
} from '@/features/instance/store';
import { cx } from '@/shared/lib/cx';
import { Avatar, Button, LogoutIcon, Modal, Spinner } from '@/shared/ui';
import dialogStyles from '@/features/instance/dialogs.module.css';
import s from './SettingsPanel.module.css';

export function SettingsPanel() {
  const session = useSessionStore((st) => st.session);
  const state = useInstanceStore((st) => st.state);
  const settings = useInstanceStore((st) => st.settings);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!session) return null;
  const missing = missingNotificationSettings(settings);
  const maskedId = `${session.idInstance.slice(0, 4)}•••${session.idInstance.slice(-4)}`;

  return (
    <section className={s.root} aria-label="Настройки">
      <header className={s.header}>
        <h1 className={s.title}>Настройки</h1>
      </header>

      <div className={s.scroll}>
        <div className={s.profile}>
          <Avatar name={session.userName} seed={session.idInstance} size={72} />
          <div className={s.profileName}>{session.userName}</div>
          <div className={s.profileSub}>Telegram · GREEN-API</div>
        </div>

        <dl className={s.card}>
          <div className={s.row}>
            <dt>Инстанс</dt>
            <dd className={s.mono} title={session.idInstance}>
              {maskedId}
            </dd>
          </div>
          <div className={s.row}>
            <dt>Состояние</dt>
            <dd>
              {state ? (
                <span className={cx(s.status, state === 'authorized' ? s.ok : s.warn)}>
                  {INSTANCE_STATE_LABEL[state]}
                </span>
              ) : (
                <Spinner size={14} />
              )}
            </dd>
          </div>
          <div className={s.row}>
            <dt>Уведомления</dt>
            <dd>
              {!settings ? (
                <Spinner size={14} />
              ) : missing.length === 0 ? (
                <span className={cx(s.status, s.ok)}>Включены</span>
              ) : (
                <Button variant="ghost" className={s.inlineBtn} onClick={() => setNotifyOpen(true)}>
                  Включить
                </Button>
              )}
            </dd>
          </div>
          <div className={s.row}>
            <dt>Сессия</dt>
            <dd>{session.remember ? 'Запомнена' : 'До закрытия вкладки'}</dd>
          </div>
        </dl>

        <Button variant="danger" block onClick={() => setLogoutOpen(true)} className={s.logout}>
          <LogoutIcon size={20} />
          Выйти
        </Button>
      </div>

      <EnableNotificationsDialog open={notifyOpen} onClose={() => setNotifyOpen(false)} />

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Выйти из аккаунта?"
        size="s"
      >
        <p className={dialogStyles.text}>
          Учётные данные и история переписки на этом устройстве будут удалены.
        </p>
        <div className={dialogStyles.actions}>
          <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={logout}>
            Выйти
          </Button>
        </div>
      </Modal>
    </section>
  );
}
