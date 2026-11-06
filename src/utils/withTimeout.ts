/**
 * Wraps a promise (or Supabase's thenable query builder) so it can never hang
 * forever. If it doesn't resolve within `ms`, this rejects with an Error
 * whose message is `timeoutMessage`, so callers can catch it exactly like any
 * other failure instead of waiting indefinitely with no feedback.
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number = 10000,
  timeoutMessage: string = 'timeout'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    clearTimeout(timer);
  }) as Promise<T>;
}
