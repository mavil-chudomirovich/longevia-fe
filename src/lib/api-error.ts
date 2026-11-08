import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { ProblemDetails } from '@/types/api';

export const isAxiosError = (error: unknown): error is AxiosError<ProblemDetails> =>
  axios.isAxiosError<ProblemDetails>(error);

export const isNetworkError = (error: unknown): boolean =>
  isAxiosError(error) && !error.response && !!error.request;

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

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = 'Thao tác thất bại. Vui lòng thử lại.'
): string => {
  const data = getApiErrorData(error);
  if (data)
    return (
      data.detail ||
      data.title ||
      data.errors?.map((item) => item.message).join(', ') ||
      fallbackMessage
    );
  if (isNetworkError(error))
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.';
  return error instanceof Error ? error.message : fallbackMessage;
};

export const formatApiErrorFields = (error: unknown, maxFields = 3): string | undefined => {
  const fields = getApiErrorFields(error);
  if (!fields) return undefined;
  const entries = Object.entries(fields);
  const visible = entries
    .slice(0, maxFields)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`);
  if (entries.length > maxFields) visible.push(`... và ${entries.length - maxFields} lỗi khác`);
  return visible.join('\n');
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
