/**
 * Fetch wrapper with AbortController-based timeout.
 *
 * Prevents external API calls from hanging indefinitely when the
 * remote service is slow or unresponsive.
 *
 * @param url - URL to fetch
 * @param options - standard RequestInit
 * @param timeoutMs - timeout in milliseconds (default 10s)
 * @throws AbortError if the timeout elapses before the response arrives
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
