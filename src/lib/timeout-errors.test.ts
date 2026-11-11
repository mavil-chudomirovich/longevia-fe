import { describe, expect, it } from 'vitest';
import { AxiosError, type AxiosRequestConfig } from 'axios';
import { getApiErrorMessage, isNetworkError, isTimeoutError } from './api-error';
import { NETWORK_ERROR_MESSAGE, TIMEOUT_ERROR_MESSAGE } from './error-messages';

function timeoutError() {
  const config: AxiosRequestConfig = { url: '/diet/targets/me/suggest' };
  const error = new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED', undefined, {});
  error.config = config as never;
  error.request = {};
  return error;
}

describe('Timeout vs network error classification', () => {
  it('treats ECONNABORTED as a timeout, not a network failure', () => {
    const error = timeoutError();
    expect(isTimeoutError(error)).toBe(true);
    expect(isNetworkError(error)).toBe(false);
    expect(getApiErrorMessage(error)).toBe(TIMEOUT_ERROR_MESSAGE);
  });

  it('keeps real connection failures as network errors', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK', undefined, {});
    error.request = {};
    expect(isTimeoutError(error)).toBe(false);
    expect(isNetworkError(error)).toBe(true);
    expect(getApiErrorMessage(error)).toBe(NETWORK_ERROR_MESSAGE);
  });
});
