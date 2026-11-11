import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { ProblemDetails } from '@/types/api';
import {
  DEFAULT_ERROR_MESSAGE,
  FRIENDLY_ERRORS,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  friendlyMessageForStatus,
  type ErrorAction,
} from '@/lib/error-messages';

export const isAxiosError = (error: unknown): error is AxiosError<ProblemDetails> =>
  axios.isAxiosError<ProblemDetails>(error);

/** Yêu cầu bị client huỷ vì quá thời gian chờ (máy chủ vẫn sống, chỉ chậm). */
export const isTimeoutError = (error: unknown): boolean =>
  isAxiosError(error) &&
  !error.response &&
  (error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.toLowerCase().includes('timeout') === true);

export const isNetworkError = (error: unknown): boolean =>
  isAxiosError(error) &&
  !error.response &&
  !!error.request &&
  error.code !== 'ERR_CANCELED' &&
  !isTimeoutError(error);

export const getApiErrorStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined;

export const getApiErrorData = (error: unknown): ProblemDetails | undefined =>
  isAxiosError(error) ? error.response?.data : undefined;

export const getApiErrorCode = (error: unknown): string | undefined => {
  const code = getApiErrorData(error)?.code;
  return typeof code === 'string' && code.length > 0 ? code : undefined;
};

export const isApiErrorCode = (error: unknown, code: string): boolean =>
  getApiErrorCode(error) === code;

export const getApiErrorFields = (error: unknown): Record<string, string[]> | undefined => {
  const errors = getApiErrorData(error)?.errors;
  if (!errors?.length) return undefined;
  return errors.reduce<Record<string, string[]>>((fields, item) => {
    fields[item.field] = [...(fields[item.field] ?? []), item.message];
    return fields;
  }, {});
};

/**
 * Thông báo thân thiện cho người dùng. Thứ tự ưu tiên:
 * 1. Bảng `FRIENDLY_ERRORS` theo `code`.
 * 2. Lỗi mạng / hết thời gian chờ.
 * 3. Lỗi dữ liệu nhập (400/422) chưa có trong bảng: dùng `detail` của BE (đã là tiếng Việt).
 * 4. Thông báo theo HTTP status, cuối cùng là `fallbackMessage`.
 * Không hiển thị mã HTTP, tên dịch vụ hay message kỹ thuật của axios/trình duyệt.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE
): string => {
  const code = getApiErrorCode(error);
  const known = code ? FRIENDLY_ERRORS[code] : undefined;
  if (known) return known.message;
  if (isTimeoutError(error)) return TIMEOUT_ERROR_MESSAGE;
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  if (isAxiosError(error)) {
    const status = getApiErrorStatus(error);
    const detail = getApiErrorData(error)?.detail;
    if ((status === 400 || status === 422) && detail) return detail;
    return friendlyMessageForStatus(status) ?? fallbackMessage;
  }
  // Lỗi do chính app tạo ra (message tiếng Việt viết sẵn) thì giữ nguyên.
  return error instanceof Error && error.message ? error.message : fallbackMessage;
};

/** Nút gợi ý bước tiếp theo (vd. "Cập nhật hồ sơ") nếu lỗi có cách khắc phục. */
export const getApiErrorAction = (error: unknown): ErrorAction | undefined => {
  const code = getApiErrorCode(error);
  return code ? FRIENDLY_ERRORS[code]?.action : undefined;
};

/** Liệt kê lỗi từng ô nhập, không kèm tên trường kỹ thuật. */
export const formatApiErrorFields = (error: unknown, maxFields = 3): string | undefined => {
  const fields = getApiErrorFields(error);
  if (!fields) return undefined;
  const messages = [...new Set(Object.values(fields).flat())];
  const visible = messages.slice(0, maxFields).map((message) => `• ${message}`);
  if (messages.length > maxFields) visible.push(`… và ${messages.length - maxFields} lỗi khác`);
  return visible.join('\n');
};

/**
 * Toast lỗi thân thiện dùng chung: thông báo theo mã lỗi, lỗi từng ô nhập (nếu có)
 * và nút dẫn tới trang khắc phục (vd. "Cập nhật hồ sơ") khi lỗi có cách xử lý.
 */
export const toastFriendlyError = (error: unknown, fallbackMessage?: string) => {
  const message = getApiErrorMessage(error, fallbackMessage);
  const fields = formatApiErrorFields(error);
  const text = fields ? `${message}\n${fields}` : message;
  const action = getApiErrorAction(error);
  if (action) {
    toast.error(text, {
      action: { label: action.label, onClick: () => window.location.assign(action.href) },
    });
  } else {
    toast.error(text);
  }
};

export const toastApiError = (error: unknown, title: string, fallbackMessage?: string) => {
  const message = getApiErrorMessage(error, fallbackMessage);
  const fields = formatApiErrorFields(error);
  toast.error(title, { description: fields ? `${message}\n${fields}` : message });
};

export const handleApiError = (error: unknown, fallbackMessage?: string) => {
  const status = getApiErrorStatus(error);
  if (
    isNetworkError(error) ||
    (status && (status >= 500 || status === 401 || status === 403 || status === 429))
  )
    return;
  toast.error(getApiErrorMessage(error, fallbackMessage));
};
