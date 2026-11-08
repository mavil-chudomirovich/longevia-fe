import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import type { ProblemDetails } from '@/types/api';
import { getAccessToken, setAccessToken } from './auth-token';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from './env';
import { sharedRefresh, forceLogout } from './auth-refresh';
import { PROTECTED_PREFIXES } from '@/common/constants/routes';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { getApiErrorMessage } from './api-error';
import { NETWORK_ERROR_MESSAGE } from './error-messages';

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
    showErrorToast?: boolean;
    errorToastMessage?: string;
  }
}

const api = axios.create({
  // Next.js API route proxy hoặc direct backend (lấy từ lib/env.ts đã validate)
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: inject token từ Single Source of Truth (memory + zustand)
// KHÔNG đọc trực tiếp localStorage ở đây nữa để tránh lệch với HttpOnly cookie.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Chuẩn hóa tránh double /api/api nếu URL gọi bắt đầu bằng /api/
    if (config.url?.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    const storeToken = useAuthStore.getState().token;
    const token = getAccessToken() ?? storeToken;
    // Tự sync lại memory nếu store còn token (trường hợp hydrate sau F5)
    if (token && !getAccessToken()) {
      setAccessToken(token);
    }
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Route cần đăng nhập theo `middleware.ts` — redirect về login kèm `from` khi mất phiên. */
/**
 * Đưa về `/login?from=<path>` khi mất phiên mà đang ở route bảo vệ.
 * Trang public giữ nguyên (không redirect gây khó chịu); AuthGuard/middleware
 * xử lý tiếp ở lần điều hướng sau. Không bao giờ redirect khi đã ở `/login`.
 */
function redirectToLoginIfProtected(): void {
  if (typeof window === 'undefined') return;
  const pathname = window.location.pathname;
  if (pathname === '/login') return;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return;
  const from = encodeURIComponent(pathname + window.location.search);
  window.location.href = `/login?from=${from}`;
}

// Response Interceptor: Refresh token queue & toast handling
let hasShownSessionExpiredToast = false;

const failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];
let queueProcessing = false;
const noRefreshRoutes = [
  API_ENDPOINTS.BFF.LOGIN,
  API_ENDPOINTS.BFF.LOGOUT,
  API_ENDPOINTS.BFF.REFRESH,
].map((path) => path.replace(/^\/api/, ''));

const processQueue = (error: unknown, token: string | null = null) => {
  queueProcessing = false;
  failedQueue.splice(0).forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ProblemDetails>) => {
    // Request bị huỷ chủ động (TanStack Query refetch/huỷ, đổi trang, đăng xuất) không phải lỗi:
    // không toast, không refresh token. Trước đây nhánh `error.request` báo nhầm "mất kết nối".
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const silent = originalRequest?.silent === true;
    const showErrorToast = originalRequest?.showErrorToast === true;
    const customErrorMessage = originalRequest?.errorToastMessage;

    if (error.response) {
      const status = error.response.status;

      // Kiểm tra lỗi xác thực 401 (hỗ trợ cả envelope mới lồng `error`)
      const isAuthError = status === 401;

      // Chỉ thử refresh khi từng có phiên (token memory/store hoặc user đã persist).
      // Guest chưa đăng nhập gặp 401 thì reject ngay: không gọi refresh vô ích, không toast sai.
      const hadSession =
        !!getAccessToken() || !!useAuthStore.getState().token || !!useAuthStore.getState().user;

      if (
        isAuthError &&
        originalRequest &&
        !originalRequest._retry &&
        !noRefreshRoutes.some((path) => originalRequest.url?.includes(path))
      ) {
        if (!hadSession) {
          return Promise.reject(error);
        }

        if (queueProcessing) {
          return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        queueProcessing = true;

        try {
          // Dùng sharedRefresh để dedup với AuthProvider + cross-tab (Web Locks)
          const newToken = await sharedRefresh();
          processQueue(null, newToken || null);
          hasShownSessionExpiredToast = false;
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          // Đăng xuất triệt để (xóa cả HttpOnly cookies) để không kẹt loop /login → /.
          await forceLogout();
          // Sự kiện mất phiên là toàn cục: luôn toast 1 lần kể cả khi request
          // kích hoạt có `silent` (silent chỉ áp dụng cho lỗi nghiệp vụ của request đó).
          if (!hasShownSessionExpiredToast) {
            toast.error('Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại nhé.');
            hasShownSessionExpiredToast = true;
          }
          redirectToLoginIfProtected();
          return Promise.reject(error);
        } finally {
          queueProcessing = false;
        }
      }

      // Xử lý thông báo lỗi toast tự động
      if (!silent) {
        if (customErrorMessage) {
          toast.error(customErrorMessage);
        } else if (status >= 500 || status === 403 || status === 429 || showErrorToast) {
          // Thông báo thân thiện theo mã lỗi (không lộ mã HTTP / tên dịch vụ).
          toast.error(getApiErrorMessage(error));
        }
      }
    } else if (error.request) {
      if (!silent) {
        toast.error(NETWORK_ERROR_MESSAGE);
      }
    }

    return Promise.reject(error);
  }
);

export function resetAxiosAuthState(): void {
  hasShownSessionExpiredToast = false;
  queueProcessing = false;
  failedQueue.splice(0);
}

export default api;
