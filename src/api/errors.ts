export type GreenApiErrorKind =
  'auth' | 'rateLimit' | 'network' | 'timeout' | 'aborted' | 'instance' | 'server' | 'badResponse';

export class GreenApiError extends Error {
  readonly kind: GreenApiErrorKind;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    kind: GreenApiErrorKind,
    message: string,
    options: { status?: number; retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'GreenApiError';
    this.kind = kind;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
  }

  get isRetryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'rateLimit' ||
      (this.kind === 'server' && (this.status ?? 0) >= 500)
    );
  }
}

export const isGreenApiError = (e: unknown): e is GreenApiError => e instanceof GreenApiError;

export function describeError(e: unknown): string {
  if (!isGreenApiError(e)) return 'Неизвестная ошибка. Попробуйте ещё раз.';
  switch (e.kind) {
    case 'auth':
      return 'Неверный idInstance или apiTokenInstance.';
    case 'rateLimit':
      return 'Слишком много запросов. Подождите немного и повторите.';
    case 'network':
      return 'Нет соединения с сервером. Проверьте интернет.';
    case 'timeout':
      return 'Сервер не ответил вовремя. Попробуйте ещё раз.';
    case 'aborted':
      return 'Запрос отменён.';
    case 'instance':
      return 'Инстанс не готов: Telegram-аккаунт не авторизован в GREEN-API.';
    case 'badResponse':
      return 'Сервер вернул неожиданный ответ.';
    case 'server':
      return e.status ? `Ошибка сервера (${e.status}). Попробуйте позже.` : 'Ошибка сервера.';
  }
}
