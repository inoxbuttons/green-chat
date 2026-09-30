/**
 * Обёртка над Web Storage: хранилище может быть недоступно (приватный режим,
 * запрет cookies) или переполнено — приложение не должно из-за этого падать.
 */
export type StorageKind = 'local' | 'session';

function get(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  read(kind: StorageKind, key: string): string | null {
    try {
      return get(kind)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  write(kind: StorageKind, key: string, value: string): boolean {
    try {
      get(kind)?.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[storage] не удалось сохранить ${key}`, e);
      return false;
    }
  },
  remove(kind: StorageKind, key: string): void {
    try {
      get(kind)?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
