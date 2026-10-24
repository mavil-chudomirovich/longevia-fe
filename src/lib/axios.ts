import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { ErrorResponse } from '@/types/api';
import { getAccessToken, setAccessToken, clearAccessToken } from './auth-token';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from './env';
import { sharedRefresh, forceLogout } from './auth-refresh';

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
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/admin'];

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
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const silent = originalRequest?.silent === true;
    const showErrorToast = originalRequest?.showErrorToast === true;
    const customErrorMessage = originalRequest?.errorToastMessage;

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Kiểm tra lỗi xác thực 401 (hỗ trợ cả envelope mới lồng `error`)
      const nestedMessage = errorData?.error?.message;
      const isAuthError =
        status === 401 ||
        (status === 500 &&
          (nestedMessage === 'Vui lòng đăng nhập' ||
            errorData?.message === 'Vui lòng đăng nhập' ||
            errorData?.detail === 'Vui lòng đăng nhập' ||
            errorData?.Detail === 'Vui lòng đăng nhập'));

      // Chỉ thử refresh khi từng có phiên (token memory/store hoặc user đã persist).
      // Guest chưa đăng nhập gặp 401 thì reject ngay: không gọi refresh vô ích, không toast sai.
      const hadSession =
        !!getAccessToken() || !!useAuthStore.getState().token || !!useAuthStore.getState().user;

      if (
        isAuthError &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login')
      ) {
        if (
          originalRequest.url?.includes('/auth/logout') ||
          originalRequest.url?.includes('/auth/refresh-token')
        ) {
          return Promise.reject(error);
        }

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
            const refreshCode =
              err instanceof AxiosError ? err.response?.data?.error?.code : undefined;
            toast.error(
              refreshCode === 'REFRESH_TOKEN_REUSED'
                ? 'Phiên đăng nhập đã bị thu hồi trên thiết bị khác. Vui lòng đăng nhập lại.'
                : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            );
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
        } else if (status >= 500) {
          toast.error('Lỗi hệ thống máy chủ. Vui lòng thử lại sau.');
        } else if (status === 403) {
          toast.error(
            nestedMessage ||
              errorData?.message ||
              errorData?.detail ||
              'Bạn không có quyền thực hiện thao tác này.'
          );
        } else if (status === 429) {
          toast.error('Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
        } else if (showErrorToast) {
          toast.error(
            nestedMessage ||
              errorData?.message ||
              errorData?.detail ||
              errorData?.title ||
              'Thao tác thất bại. Vui lòng thử lại.'
          );
        }
      }
    } else if (error.request) {
      if (!silent) {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.');
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
