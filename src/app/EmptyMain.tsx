import { StatusBanner } from '@/features/instance/StatusBanner';
import s from './EmptyMain.module.css';

export function EmptyMain() {
  return (
    <div className={`${s.root} wallpaper`}>
      <div className={s.bannerSlot}>
        <StatusBanner className={s.banner} />
      </div>
      <span className={s.pill}>Выберите чат или добавьте новый контакт</span>
    </div>
  );
}
