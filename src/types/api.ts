/**
 * Khung phản hồi chuẩn cho các API thành công (APIResponse)
 * Sử dụng Generic <T> để FE có thể truyền linh hoạt kiểu dữ liệu của cục data vào
 */
export interface APIResponse<T = unknown> {
  message?: string;
  data?: T;
  code?: string | number;
  success?: boolean;
}

/**
 * Body lỗi theo contract backend mới: `{ success: false, error: { code, message, fields?, requestId? } }`
 * (xem BACKEND_INTEGRATION.md §3.2). Frontend luôn branch theo `code`, `message` chỉ để hiển thị fallback.
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, unknown>;
  requestId?: string;
}

/** Envelope lỗi chuẩn của backend. */
export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorBody;
}

/**
 * Khung phản hồi chuẩn khi API gặp lỗi (ErrorResponse)
 * Thường dùng để bắt trong catch block của Axios hoặc React Query
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success?: false;
  /** Shape mới (nested). Ưu tiên đọc field này. */
  error?: ApiErrorBody;
  /** Các field shape cũ — giữ tương thích ngược với consumer hiện có. */
  status?: number;
  statusCode?: number;
  title?: string;
  message?: string;
  detail?: string;
  Detail?: string;
  errors?: ValidationErrorItem[];
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  metadata: PaginationMetadata;
}
