import { clearChatsStorage } from '@/features/chats/store';
import { useInstanceStore } from '@/features/instance/store';
import { useSessionStore } from './session';

/** Полный выход: удаляет учётные данные и локальную историю этого инстанса. */
export function logout(): void {
  const session = useSessionStore.getState().session;
  if (session) clearChatsStorage(session.idInstance);
  useInstanceStore.getState().reset();
  useSessionStore.getState().signOut();
}
