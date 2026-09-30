import { selectTotalUnread, useChatsStore } from '@/features/chats/store';
import { cx } from '@/shared/lib/cx';
import { ChatsIcon, SettingsIcon } from '@/shared/ui';
import { useUiStore, type Section } from './uiStore';
import s from './NavRail.module.css';

export function NavRail({ className }: { className?: string }) {
  const section = useUiStore((st) => st.section);
  const setSection = useUiStore((st) => st.setSection);
  const unread = useChatsStore(selectTotalUnread);

  const item = (id: Section, label: string, icon: React.ReactNode, badge?: number) => (
    <button
      type="button"
      className={cx(s.item, section === id && s.active)}
      aria-current={section === id ? 'page' : undefined}
      onClick={() => setSection(id)}
    >
      <span className={s.icon}>
        {icon}
        {!!badge && (
          <span className={s.badge} aria-label={`${badge} непрочитанных`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className={s.label}>{label}</span>
    </button>
  );

  return (
    <nav className={cx(s.rail, className)} aria-label="Разделы">
      {item('chats', 'Все', <ChatsIcon size={26} />, unread)}
      <div className={s.spacer} />
      {item('settings', 'Настройки', <SettingsIcon size={26} />)}
    </nav>
  );
}
