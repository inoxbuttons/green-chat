import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/ui';
import s from './ErrorBoundary.module.css';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Точка подключения мониторинга ошибок (Sentry и т. п.).
    console.error('[app] необработанная ошибка', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={s.root} role="alert">
        <h1 className={s.title}>Что-то пошло не так</h1>
        <p className={s.text}>Попробуйте перезагрузить страницу. Ваша переписка сохранена.</p>
        <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
      </div>
    );
  }
}
