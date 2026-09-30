/**
 * Очередь уведомлений одна на инстанс: если опрашивать её из нескольких вкладок,
 * они будут «отбирать» уведомления друг у друга. Web Locks API гарантирует,
 * что опрос ведёт ровно одна вкладка; при её закрытии блокировку получает следующая.
 */
export function runWhileLeader(
  lockName: string,
  task: (signal: AbortSignal) => Promise<void>,
  signal: AbortSignal,
): void {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    void task(signal);
    return;
  }
  navigator.locks
    .request(lockName, { signal }, () => task(signal))
    .catch((e: unknown) => {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error('[notifications] ошибка блокировки вкладки', e);
      }
    });
}
