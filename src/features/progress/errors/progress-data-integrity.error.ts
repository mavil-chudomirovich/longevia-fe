/**
 * Lỗi vi phạm tính toàn vẹn dữ liệu sức khỏe của module Progress.
 * Xuất hiện khi dữ liệu trả về từ backend thiếu trường bắt buộc hoặc chứa timestamp không hợp lệ.
 * Đảm bảo không ghi đè thời gian hiện tại, không log payload nhạy cảm hay access token.
 */
export class ProgressDataIntegrityError extends Error {
  readonly name = 'ProgressDataIntegrityError';
  readonly fieldName: string;
  readonly code:
    | 'PROGRESS_INVALID_TIMESTAMP'
    | 'PROGRESS_MISSING_REQUIRED_FIELD'
    | 'PROGRESS_DATA_INTEGRITY_VIOLATION';
  readonly resourceName?: string;

  constructor(
    fieldName: string,
    code:
      | 'PROGRESS_INVALID_TIMESTAMP'
      | 'PROGRESS_MISSING_REQUIRED_FIELD'
      | 'PROGRESS_DATA_INTEGRITY_VIOLATION' = 'PROGRESS_INVALID_TIMESTAMP',
    resourceName?: string,
    customMessage?: string
  ) {
    const defaultMessage = 'Dữ liệu thời gian nhận được không hợp lệ. Vui lòng thử lại.';
    super(customMessage ?? defaultMessage);
    this.fieldName = fieldName;
    this.code = code;
    this.resourceName = resourceName;

    Object.setPrototypeOf(this, ProgressDataIntegrityError.prototype);
  }
}

/**
 * Lỗi xảy ra khi thực hiện thao tác thay đổi dữ liệu (mutation) mà không có phiên xác thực hợp lệ.
 */
export class ProgressAuthError extends Error {
  readonly name = 'ProgressAuthError';
  readonly code = 'PROGRESS_UNAUTHENTICATED_MUTATION';

  constructor(message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.') {
    super(message);
    Object.setPrototypeOf(this, ProgressAuthError.prototype);
  }
}
