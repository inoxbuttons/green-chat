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
      console.warn(`Failed to persist ${key}`, e);
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
