import { AxiosError } from 'axios';
import { ErrorResponse } from '@/types/api';
import { toast } from 'sonner';

/**
 * Type guard to check if an unknown error is an AxiosError.
 */
export const isAxiosError = (error: unknown): error is AxiosError<ErrorResponse> => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
};

/**
 * Checks if the error is a network error (no response received).
 */
export const isNetworkError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
};

/**
 * Gets the HTTP status code from an API error response.
 */
export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

/**
 * Gets the raw error data payload from an API error response.
 */
export const getApiErrorData = (error: unknown): ErrorResponse | undefined => {
  if (isAxiosError(error)) {
    return error.response?.data;
  }
  return undefined;
};

/**
 * Reads the backend business error code (`error.code`, nested envelope).
 * Always branch on this code, never on message text.
 */
export const getApiErrorCode = (error: unknown): string | undefined => {
  const data = getApiErrorData(error);
  if (!data) return undefined;
  const nested = data.error?.code;
  if (typeof nested === 'string' && nested.length > 0) return nested;
  return undefined;
};

/**
 * Reads per-field validation errors (`error.fields`, nested envelope).
 */
export const getApiErrorFields = (error: unknown): Record<string, unknown> | undefined => {
  const data = getApiErrorData(error);
  const fields = data?.error?.fields;
  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    return fields as Record<string, unknown>;
  }
  return undefined;
};

/**
 * Extracts a user-friendly error message from an API error response.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string = 'Thao tác thất bại. Vui lòng thử lại.'
): string => {
  if (isAxiosError(error)) {
    const errorData = error.response?.data;
    if (errorData) {
      const nestedMessage = errorData.error?.message;
      if (typeof nestedMessage === 'string' && nestedMessage.length > 0) return nestedMessage;
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        return errorData.errors.map((e) => e.message).join(', ');
      }
      return (
        errorData.message ||
        errorData.detail ||
        errorData.Detail ||
        errorData.title ||
        fallbackMessage
      );
    }
    if (isNetworkError(error)) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.';
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

/**
 * Tóm tắt lỗi từng field (`error.fields`) thành text hiển thị trong toast.
 * Ví dụ: { "title": ["Quá ngắn"] } -> "title: Quá ngắn". Giới hạn số dòng
 * để toast không quá dài; phần còn lại user xem trong Network/log.
 */
export const formatApiErrorFields = (error: unknown, maxFields: number = 3): string | undefined => {
  const fields = getApiErrorFields(error);
  if (!fields) return undefined;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    const messages = Array.isArray(value) ? value.map((v) => String(v)).join(', ') : String(value);
    parts.push(`${key}: ${messages}`);
    if (parts.length >= maxFields) break;
  }
  if (parts.length === 0) return undefined;
  const extra = Object.keys(fields).length - parts.length;
  return extra > 0 ? [...parts, `... và ${extra} lỗi khác`].join('\n') : parts.join('\n');
};

/**
 * Toast lỗi API bám message backend: dòng chính là `error.message` từ server
 * (tiếng Việt), dòng phụ là tối đa vài lỗi field. Không bao giờ hiện message
 * generic của axios ("Request failed with status code 400").
 */
export const toastApiError = (error: unknown, title: string, fallbackMessage?: string) => {
  const message = getApiErrorMessage(error, fallbackMessage);
  const fields = formatApiErrorFields(error);
  toast.error(title, {
    description: fields ? `${message}\n${fields}` : message,
  });
};

/**
 * Handles API errors by showing a toast, avoiding duplicates with Axios global handler.
 */
export const handleApiError = (error: unknown, fallbackMessage?: string) => {
  const status = getApiErrorStatus(error);
  const isNetwork = isNetworkError(error);

  // Skip global codes that are already handled in Axios interceptor
  if (
    isNetwork ||
    (status && (status >= 500 || status === 403 || status === 429 || status === 401))
  ) {
    return;
  }

  const msg = getApiErrorMessage(error, fallbackMessage);
  if (msg) {
    toast.error(msg);
  }
};
