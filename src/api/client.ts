import { GreenApiError } from './errors';
import {
  asCheckAccount,
  asIdMessage,
  asNotification,
  asResultFlag,
  asSettings,
  asStateInstance,
  isRecord,
} from './guards';
import type {
  CheckAccountResult,
  Credentials,
  InstanceSettings,
  InstanceState,
  Notification,
  SendMessageParams,
} from './types';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 500;

/** Долгий опрос: сервер держит соединение до receiveTimeout секунд (5–60). */
export const RECEIVE_TIMEOUT_S = 25;

export function resolveApiUrl(idInstance: string): string {
  const override = import.meta.env.VITE_GREEN_API_URL as string | undefined;
  if (override) return override.replace(/\/+$/, '');
  // Хост инстанса определяется первыми четырьмя цифрами idInstance.
  return `https://${idInstance.slice(0, 4)}.api.green-api.com`;
}

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'DELETE';
  /** Часть пути после токена, например `/12345` для deleteNotification. */
  suffix?: string;
  query?: Record<string, string | number>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Разрешены ли автоматические повторы. Только для идемпотентных вызовов. */
  retry?: boolean;
  parse: (json: unknown) => T | undefined | null;
  /** Когда `null` — допустимый результат (receiveNotification без уведомлений). */
  allowNull?: boolean;
}

export interface GreenApiClientOptions {
  apiUrl?: string;
  fetch?: typeof fetch;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

export class GreenApiClient {
  readonly idInstance: string;
  readonly apiUrl: string;
  readonly #token: string;
  readonly #fetch: typeof fetch;
  readonly #sleep: (ms: number, signal?: AbortSignal) => Promise<void>;

  constructor(credentials: Credentials, options: GreenApiClientOptions = {}) {
    this.idInstance = credentials.idInstance;
    this.#token = credentials.apiTokenInstance;
    this.apiUrl = options.apiUrl ?? resolveApiUrl(credentials.idInstance);
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#sleep = options.sleep ?? abortableSleep;
  }

  // ─── Account ────────────────────────────────────────────────────────────────

  getStateInstance(signal?: AbortSignal): Promise<InstanceState> {
    return this.#request('getStateInstance', { signal, retry: true, parse: asStateInstance });
  }

  getSettings(signal?: AbortSignal): Promise<InstanceSettings> {
    return this.#request('getSettings', { signal, retry: true, parse: asSettings });
  }

  async setSettings(settings: InstanceSettings, signal?: AbortSignal): Promise<void> {
    const ok = await this.#request('setSettings', {
      method: 'POST',
      body: settings,
      signal,
      retry: true,
      parse: (j) => asResultFlag(j, 'saveSettings'),
    });
    if (!ok) throw new GreenApiError('server', 'Настройки не сохранены');
  }

  // ─── Service ────────────────────────────────────────────────────────────────

  /** Проверяет наличие Telegram у номера и возвращает chatId собеседника. */
  checkAccount(phoneNumber: string, signal?: AbortSignal): Promise<CheckAccountResult> {
    return this.#request('checkAccount', {
      method: 'POST',
      body: { phoneNumber: Number(phoneNumber) },
      signal,
      retry: true,
      parse: asCheckAccount,
    });
  }

  // ─── Sending ────────────────────────────────────────────────────────────────

  /**
   * Ставит сообщение в очередь отправки GREEN-API и возвращает idMessage.
   * Намеренно без автоповторов: при обрыве соединения сообщение могло уже
   * попасть в очередь, повтор создал бы дубль.
   */
  sendMessage(params: SendMessageParams, signal?: AbortSignal): Promise<string> {
    return this.#request('sendMessage', {
      method: 'POST',
      body: params,
      signal,
      retry: false,
      parse: asIdMessage,
    });
  }

  // ─── Receiving (HTTP API) ───────────────────────────────────────────────────

  receiveNotification(signal?: AbortSignal): Promise<Notification | null> {
    return this.#request('receiveNotification', {
      query: { receiveTimeout: RECEIVE_TIMEOUT_S },
      timeoutMs: (RECEIVE_TIMEOUT_S + 10) * 1000,
      signal,
      retry: false, // повторы делает цикл опроса
      parse: asNotification,
      allowNull: true,
    });
  }

  async deleteNotification(receiptId: number, signal?: AbortSignal): Promise<void> {
    await this.#request('deleteNotification', {
      method: 'DELETE',
      suffix: `/${receiptId}`,
      signal,
      retry: true,
      parse: (j) => asResultFlag(j, 'result'),
    });
  }

  // ─── Transport ──────────────────────────────────────────────────────────────

  #buildUrl(method: string, suffix = '', query?: Record<string, string | number>): string {
    const url = new URL(
      `${this.apiUrl}/waInstance${encodeURIComponent(this.idInstance)}/${method}/${encodeURIComponent(this.#token)}${suffix}`,
    );
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
    return url.toString();
  }

  async #request<T>(apiMethod: string, opts: RequestOptions<T>): Promise<T> {
    const attempts = opts.retry ? MAX_RETRIES + 1 : 1;
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await this.#requestOnce(apiMethod, opts);
      } catch (e) {
        lastError = e;
        const canRetry = e instanceof GreenApiError && e.isRetryable && attempt < attempts - 1;
        if (!canRetry) throw e;
        const backoff = e.retryAfterMs ?? BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 250;
        await this.#sleep(backoff, opts.signal);
      }
    }
    throw lastError;
  }

  async #requestOnce<T>(apiMethod: string, opts: RequestOptions<T>): Promise<T> {
    const { signal, cleanup, didTimeout } = withTimeout(
      opts.signal,
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    const method = opts.method ?? 'GET';
    let response: Response;
    try {
      response = await this.#fetch(this.#buildUrl(apiMethod, opts.suffix, opts.query), {
        method,
        headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal,
        cache: 'no-store',
      });
    } catch (e) {
      cleanup();
      if (didTimeout()) throw new GreenApiError('timeout', `${apiMethod}: timeout`, { cause: e });
      if (opts.signal?.aborted)
        throw new GreenApiError('aborted', `${apiMethod}: aborted`, { cause: e });
      throw new GreenApiError('network', `${apiMethod}: network error`, { cause: e });
    }

    let text: string;
    try {
      text = await response.text();
    } catch (e) {
      if (didTimeout()) throw new GreenApiError('timeout', `${apiMethod}: timeout`, { cause: e });
      if (opts.signal?.aborted)
        throw new GreenApiError('aborted', `${apiMethod}: aborted`, { cause: e });
      throw new GreenApiError('network', `${apiMethod}: body read failed`, { cause: e });
    } finally {
      cleanup();
    }

    if (!response.ok) throw httpError(apiMethod, response, text);

    const json = parseJson(text);
    rejectFailureEnvelope(apiMethod, json);

    const parsed = opts.parse(json);
    if (parsed === null && opts.allowNull) return null as T;
    if (parsed === null || parsed === undefined) {
      throw new GreenApiError('badResponse', `${apiMethod}: unexpected response`, {
        status: response.status,
      });
    }
    return parsed;
  }
}

const NOT_READY_RE = /not authorized|instance is starting/i;

function httpError(apiMethod: string, response: Response, body: string): GreenApiError {
  const { status } = response;
  // Неавторизованный инстанс: HTTP 400 с текстом «instance is starting or not authorized».
  if (status === 400 && NOT_READY_RE.test(body)) {
    return new GreenApiError('instance', `${apiMethod}: instance not ready`, { status });
  }
  if (status === 401 || status === 403) {
    return new GreenApiError('auth', `${apiMethod}: unauthorized`, { status });
  }
  if (status === 429) {
    return new GreenApiError('rateLimit', `${apiMethod}: rate limited`, {
      status,
      retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
    });
  }
  return new GreenApiError('server', `${apiMethod}: HTTP ${status}`, { status });
}

/**
 * Часть методов отвечает HTTP 200 с телом `{ status: false, ... }`,
 * например когда инстанс не авторизован или превышен лимит.
 */
function rejectFailureEnvelope(apiMethod: string, json: unknown): void {
  if (!isRecord(json) || json.status !== false) return;
  const data = isRecord(json.data) ? json.data : undefined;
  if (data?.reason === 'rate_limit_exceeded') {
    const retryAfter = typeof data.retryAfter === 'number' ? data.retryAfter : undefined;
    throw new GreenApiError('rateLimit', `${apiMethod}: rate limited`, {
      // retryAfter приходит в миллисекундах; ограничиваем, чтобы не зависнуть надолго.
      retryAfterMs: retryAfter !== undefined ? Math.min(retryAfter, 60_000) : undefined,
    });
  }
  throw new GreenApiError('instance', `${apiMethod}: instance not ready`);
}

function parseJson(text: string): unknown {
  if (text.trim() === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch (e) {
    throw new GreenApiError('badResponse', 'Invalid JSON', { cause: e });
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? Math.min(seconds * 1000, 60_000) : undefined;
}

function withTimeout(outer: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onAbort = () => controller.abort();
  if (outer?.aborted) controller.abort();
  else outer?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      outer?.removeEventListener('abort', onAbort);
    },
  };
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new GreenApiError('aborted', 'aborted'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new GreenApiError('aborted', 'aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
