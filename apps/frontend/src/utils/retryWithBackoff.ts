/**
 * Retry with Exponential Backoff Utility
 * 
 * Implements automatic retry logic with exponential backoff for transient failures.
 * Limits to 3 automatic retries before requiring manual intervention.
 * 
 * Requirements: 30.4-30.6
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executes a function with automatic retry and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with the function result
 * @throws Error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff: baseDelay * 2^attempt
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Log retry attempt
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay. Error: ${lastError.message}`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Checks if an error is retryable (network or transient errors)
 * 
 * @param error - Error to check
 * @returns true if the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error.message.includes('timeout')) {
    return true;
  }

  // Server errors (5xx)
  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    return true;
  }

  // Rate limit errors (429)
  if (error.message.includes('429') || error.message.includes('rate limit')) {
    return true;
  }

  return false;
}

/**
 * Wrapper for fetch with automatic retry
 * 
 * @param url - URL to fetch
 * @param init - Fetch options
 * @param retryOptions - Retry configuration
 * @returns Promise with the fetch response
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init);

    // Only retry on network errors or 5xx server errors
    if (!response.ok && (response.status >= 500 || response.status === 429)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }, retryOptions);
}
