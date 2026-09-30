// The notification queue is shared per instance, so only one tab may poll it.
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
        console.error('Failed to acquire poll lock', e);
      }
    });
}
