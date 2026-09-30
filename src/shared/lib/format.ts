const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dayYearFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});
const weekdayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

const startOfDay = (ts: number) => new Date(ts).setHours(0, 0, 0, 0);
const DAY_MS = 86_400_000;

export const formatTime = (ts: number) => timeFmt.format(ts);

export const isSameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

/** «Сегодня», «Вчера», «12 сентября», «12 сентября 2025 г.» */
export function formatDayLabel(ts: number, now = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS);
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  return new Date(ts).getFullYear() === new Date(now).getFullYear()
    ? dayFmt.format(ts)
    : dayYearFmt.format(ts);
}

/** Время в списке чатов: сегодня — часы, на неделе — день недели, иначе дата. */
export function formatListTime(ts: number, now = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS);
  if (diffDays === 0) return formatTime(ts);
  if (diffDays < 7) return weekdayFmt.format(ts);
  return shortDateFmt.format(ts);
}

export function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
