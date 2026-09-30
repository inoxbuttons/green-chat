import { memo } from 'react';
import { cx } from '@/shared/lib/cx';
import { initials } from '@/shared/lib/initials';
import s from './Avatar.module.css';

const GRADIENTS = [
  ['#ffa37a', '#ff5f6d'],
  ['#ffd36e', '#ff9f1a'],
  ['#8be08f', '#34b16b'],
  ['#6fd6ff', '#2f8cff'],
  ['#b39cff', '#6a4cf0'],
  ['#ff9fcf', '#ec4c8f'],
  ['#6ee7d7', '#16a39a'],
] as const;

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface AvatarProps {
  name: string;
  /** Стабильный ключ для выбора цвета (chatId). */
  seed: string;
  size?: number;
  className?: string;
}

export const Avatar = memo(function Avatar({ name, seed, size = 40, className }: AvatarProps) {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length]!;
  return (
    <span
      className={cx(s.avatar, className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
});
