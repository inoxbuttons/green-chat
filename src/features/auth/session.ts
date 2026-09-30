import { create } from 'zustand';
import { GreenApiClient } from '@/api';
import { isRecord } from '@/api/guards';
import { safeStorage } from '@/shared/lib/storage';

export interface Session {
  idInstance: string;
  apiTokenInstance: string;
  userName: string;
  /** true — localStorage (переживает закрытие браузера), false — sessionStorage. */
  remember: boolean;
}

const KEY = 'green-chat:session';

function isSession(v: unknown): v is Session {
  return (
    isRecord(v) &&
    typeof v.idInstance === 'string' &&
    typeof v.apiTokenInstance === 'string' &&
    typeof v.userName === 'string' &&
    typeof v.remember === 'boolean'
  );
}

function loadSession(): Session | null {
  for (const kind of ['session', 'local'] as const) {
    const raw = safeStorage.read(kind, KEY);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSession(parsed)) return parsed;
    } catch {
      /* повреждённые данные — игнорируем */
    }
    safeStorage.remove(kind, KEY);
  }
  return null;
}

function persistSession(session: Session | null): void {
  safeStorage.remove('session', KEY);
  safeStorage.remove('local', KEY);
  if (session)
    safeStorage.write(session.remember ? 'local' : 'session', KEY, JSON.stringify(session));
}

interface SessionState {
  session: Session | null;
  client: GreenApiClient | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const clientFor = (s: Session | null) =>
  s ? new GreenApiClient({ idInstance: s.idInstance, apiTokenInstance: s.apiTokenInstance }) : null;

const initial = loadSession();

export const useSessionStore = create<SessionState>((set) => ({
  session: initial,
  client: clientFor(initial),
  signIn: (session) => {
    persistSession(session);
    set({ session, client: clientFor(session) });
  },
  signOut: () => {
    persistSession(null);
    set({ session: null, client: null });
  },
}));

/** Клиент API текущей сессии. Используется только внутри авторизованной части приложения. */
export function useClient(): GreenApiClient {
  const client = useSessionStore((s) => s.client);
  if (!client) throw new Error('useClient() вызван без активной сессии');
  return client;
}
