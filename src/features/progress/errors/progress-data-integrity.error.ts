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
  readonly name: string = 'ProgressAuthError';
  readonly code: 'PROGRESS_UNAUTHENTICATED_MUTATION' | 'PROGRESS_SESSION_OBSOLETE' =
    'PROGRESS_UNAUTHENTICATED_MUTATION';

  constructor(
    message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    code:
      | 'PROGRESS_UNAUTHENTICATED_MUTATION'
      | 'PROGRESS_SESSION_OBSOLETE' = 'PROGRESS_UNAUTHENTICATED_MUTATION'
  ) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, ProgressAuthError.prototype);
  }
}

/**
 * Lỗi xảy ra khi mutation giải quyết sau khi phiên khởi tạo đã bị hủy hoặc chuyển đổi tài khoản.
 * Được ném ra để bảo vệ không trả về dữ liệu riêng tư của phiên cũ cho phiên mới.
 */
export class ProgressSessionObsoleteError extends ProgressAuthError {
  override readonly name = 'ProgressSessionObsoleteError';

  constructor(
    message = 'Phiên thực thi đã kết thúc hoặc chuyển đổi. Kết quả thao tác bị hủy để bảo vệ dữ liệu.'
  ) {
    super(message, 'PROGRESS_SESSION_OBSOLETE');
    Object.setPrototypeOf(this, ProgressSessionObsoleteError.prototype);
  }
}
