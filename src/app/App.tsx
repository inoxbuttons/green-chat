import { LoginPage } from '@/features/auth/LoginPage';
import { useSessionStore } from '@/features/auth/session';
import { ToastViewport } from '@/shared/ui';
import { ErrorBoundary } from './ErrorBoundary';
import { Messenger } from './Messenger';

export function App() {
  const session = useSessionStore((s) => s.session);
  return (
    <ErrorBoundary>
      {session ? <Messenger key={session.idInstance} /> : <LoginPage />}
      <ToastViewport />
    </ErrorBoundary>
  );
}
