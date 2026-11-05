import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import api from './axios';
import { setAccessToken, clearAccessToken } from './auth-token';
import { useAuthStore } from '@/store/useAuthStore';

describe('Axios Client & URL Construction', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    clearAccessToken();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('normalizes URLs starting with /api/ to prevent double /api/api', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null;
    const testAdapter: AxiosAdapter = (config) => {
      capturedConfig = config;
      return Promise.resolve({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };
    api.defaults.adapter = testAdapter;

    await api.get('/api/progress/dashboard/summary', { silent: true });

    expect(capturedConfig).not.toBeNull();
    if (!capturedConfig) throw new Error('Config was not captured');
    const cfg: InternalAxiosRequestConfig = capturedConfig;
    expect(cfg.url).toBe('/progress/dashboard/summary');
  });

  it('preserves clean endpoint paths without leading /api/', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null;
    const testAdapter: AxiosAdapter = (config) => {
      capturedConfig = config;
      return Promise.resolve({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };
    api.defaults.adapter = testAdapter;

    await api.get('/progress/fasting/current', { silent: true });

    expect(capturedConfig).not.toBeNull();
    if (!capturedConfig) throw new Error('Config was not captured');
    const cfg: InternalAxiosRequestConfig = capturedConfig;
    expect(cfg.url).toBe('/progress/fasting/current');
  });

  it('injects Bearer token from in-memory auth store', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null;
    const testAdapter: AxiosAdapter = (config) => {
      capturedConfig = config;
      return Promise.resolve({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };
    api.defaults.adapter = testAdapter;

    setAccessToken('test-jwt-token-xyz');
    await api.get('/progress/water/today', { silent: true });

    expect(capturedConfig).not.toBeNull();
    if (!capturedConfig) throw new Error('Config was not captured');
    const cfg: InternalAxiosRequestConfig = capturedConfig;
    expect(cfg.headers.Authorization).toBe('Bearer test-jwt-token-xyz');
  });
});
