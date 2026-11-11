/**
 * Thông báo lỗi thân thiện cho người dùng, rẽ nhánh theo `code` của ProblemDetails.
 *
 * Nguyên tắc viết:
 * - Nói điều gì xảy ra bằng ngôn ngữ đời thường, không lộ tên dịch vụ, mã HTTP hay thuật ngữ kỹ thuật.
 * - Luôn gợi ý bước tiếp theo (thử lại, cập nhật hồ sơ, …).
 * - Khi có trang giúp khắc phục, kèm `action` để UI hiện nút dẫn tới đó.
 */

export interface ErrorAction {
  label: string;
  href: string;
}

export interface FriendlyError {
  message: string;
  action?: ErrorAction;
}

const PROFILE_ACTION: ErrorAction = { label: 'Cập nhật hồ sơ', href: '/profile' };
const WEIGHT_ACTION: ErrorAction = { label: 'Ghi cân nặng', href: '/progress/metrics' };
const TARGET_ACTION: ErrorAction = { label: 'Thiết lập mục tiêu', href: '/diet/targets' };
const LOGIN_ACTION: ErrorAction = { label: 'Đăng nhập', href: '/login' };

const TEMPORARY = 'Hệ thống đang hơi chậm một chút. Bạn vui lòng thử lại sau ít phút nhé.';

export const FRIENDLY_ERRORS: Record<string, FriendlyError> = {
  // Identity
  'identity.invalid_credentials': {
    message:
      'Email hoặc mật khẩu chưa đúng. Nếu bạn vừa đăng ký, hãy mở email và bấm link xác thực trước khi đăng nhập.',
  },
  'identity.email_not_verified': {
    message:
      'Tài khoản chưa xác minh email. Bạn mở link trong email kích hoạt, hoặc gửi lại email xác minh.',
    action: { label: 'Đăng nhập', href: '/login' },
  },
  'identity.email_taken': {
    message:
      'Email này đã được đăng ký. Bạn hãy đăng nhập, hoặc dùng "Quên mật khẩu" nếu không nhớ.',
    action: LOGIN_ACTION,
  },
  'identity.user_suspended': {
    message: 'Tài khoản của bạn đang tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.',
  },
  'identity.user_not_found': {
    message: 'Không tìm thấy tài khoản. Bạn vui lòng đăng nhập lại.',
    action: LOGIN_ACTION,
  },
  'identity.invalid_current_password': {
    message: 'Mật khẩu hiện tại chưa đúng. Bạn kiểm tra lại giúp mình nhé.',
  },
  'identity.invalid_password_reset_token': {
    message:
      'Mã đặt lại mật khẩu không đúng hoặc đã hết hạn. Bạn hãy yêu cầu gửi mã mới và thử lại.',
    action: { label: 'Gửi lại mã', href: '/forgot-password' },
  },
  'identity.invalid_verification_token': {
    message:
      'Link xác thực không còn hiệu lực (có thể đã được dùng hoặc hết hạn). Nếu tài khoản đã kích hoạt, bạn chỉ cần đăng nhập.',
    action: LOGIN_ACTION,
  },
  'identity.invalid_refresh_token': {
    message: 'Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại.',
    action: LOGIN_ACTION,
  },
  'identity.unauthorized': {
    message: 'Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại.',
    action: LOGIN_ACTION,
  },
  'identity.validation_failed': {
    message: 'Một vài thông tin chưa hợp lệ. Bạn kiểm tra lại các ô được đánh dấu nhé.',
  },

  // Diet
  'diet.target_not_found': {
    message:
      'Bạn chưa có mục tiêu dinh dưỡng. Hãy thiết lập mục tiêu trước để Longevia gợi ý chính xác hơn.',
    action: TARGET_ACTION,
  },
  'diet.weight_not_found': {
    message: 'Bạn chưa ghi cân nặng. Hãy ghi cân nặng gần nhất để tính toán chính xác hơn.',
    action: WEIGHT_ACTION,
  },
  'diet.profile_not_found': {
    message: 'Bạn chưa thiết lập hồ sơ sức khỏe. Hãy cập nhật hồ sơ để tiếp tục.',
    action: PROFILE_ACTION,
  },
  'diet.profile_incomplete': {
    message:
      'Hồ sơ sức khỏe còn thiếu thông tin (ngày sinh, giới tính, chiều cao hoặc mức vận động). Hãy bổ sung để tiếp tục.',
    action: PROFILE_ACTION,
  },
  'diet.profile_not_supported': {
    message:
      'Hồ sơ hiện chưa phù hợp để tính tự động. Bạn có thể nhập mục tiêu dinh dưỡng thủ công.',
    action: TARGET_ACTION,
  },
  'diet.food_not_found': {
    message: 'Có món ăn không còn trong danh mục. Bạn hãy chọn lại món và thử lại.',
  },
  'diet.no_safe_candidate': {
    message:
      'Chưa có món nào đủ thông tin dị ứng để gợi ý an toàn cho bạn. Hãy thêm vài món kèm thông tin dị ứng rồi thử lại.',
    action: { label: 'Thêm món ăn', href: '/diet/foods' },
  },
  'diet.invalid_recommendation_query': {
    message: 'Lựa chọn bữa ăn hoặc mục tiêu chưa hợp lệ. Bạn chọn lại giúp mình nhé.',
  },
  'diet.ai_timeout': {
    message: 'Trợ lý gợi ý đang mất nhiều thời gian hơn bình thường. Bạn thử lại sau giây lát nhé.',
  },
  'diet.ai_unavailable': {
    message: 'Trợ lý gợi ý đang tạm nghỉ. Bạn vui lòng thử lại sau ít phút.',
  },
  'diet.ai_integration_failed': { message: TEMPORARY },
  'diet.profile_timeout': { message: TEMPORARY },
  'diet.profile_unavailable': { message: TEMPORARY },
  'diet.profile_integration_failed': { message: TEMPORARY },
  'diet.weight_timeout': { message: TEMPORARY },
  'diet.weight_unavailable': { message: TEMPORARY },
  'diet.weight_integration_failed': { message: TEMPORARY },
  'diet.unauthorized': {
    message: 'Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại.',
    action: LOGIN_ACTION,
  },

  // Progress
  'progress.profile_not_found': {
    message:
      'Bạn chưa thiết lập hồ sơ sức khỏe. Hãy cập nhật chiều cao và ngày sinh để Longevia tính chỉ số cho bạn.',
    action: PROFILE_ACTION,
  },
  'progress.height_unavailable': {
    message: 'Hồ sơ của bạn chưa có chiều cao nên chưa tính được BMI. Hãy bổ sung chiều cao nhé.',
    action: PROFILE_ACTION,
  },
  'progress.identity_unavailable': { message: TEMPORARY },
  'progress.identity_integration_failure': { message: TEMPORARY },
  'progress.fasting_active_conflict': {
    message:
      'Bạn đang có một phiên nhịn ăn chưa kết thúc. Hãy kết thúc phiên đó trước khi bắt đầu phiên mới.',
  },
  'progress.fasting_no_active': {
    message: 'Hiện không có phiên nhịn ăn nào đang diễn ra.',
  },
  'progress.fasting_not_found': {
    message: 'Không tìm thấy phiên nhịn ăn này. Bạn tải lại trang giúp mình nhé.',
  },
  'progress.fasting_end_conflict': {
    message:
      'Phiên nhịn ăn này đã được kết thúc trước đó. Bạn tải lại trang để xem kết quả mới nhất.',
  },
  'progress.fasting_invalid_time': {
    message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
  },
  'progress.fasting_invalid_protocol': {
    message: 'Kiểu nhịn ăn chưa hợp lệ. Bạn chọn lại giúp mình nhé.',
  },
  'progress.fasting_target_mismatch': {
    message: 'Số giờ mục tiêu chưa khớp với kiểu nhịn ăn đã chọn. Bạn chọn lại giúp mình nhé.',
  },
  'progress.fasting_custom_target_out_of_bounds': {
    message: 'Với kiểu tùy chỉnh, số giờ nhịn ăn cần từ 1 đến 24 giờ.',
  },
  'progress.invalid_timestamp': {
    message: 'Thời gian không được ở tương lai. Bạn chọn lại thời điểm giúp mình nhé.',
  },
  'progress.water_amount_invalid': {
    message: 'Lượng nước mỗi lần ghi cần từ 1 đến 5.000 ml.',
  },
  'progress.sleep_invalid_time': {
    message: 'Giờ thức dậy phải sau giờ đi ngủ.',
  },
  'progress.sleep_duration_exceeded': {
    message: 'Một giấc ngủ không thể dài quá 24 giờ. Bạn kiểm tra lại giờ ngủ và giờ dậy nhé.',
  },
  'progress.sleep_overlap': {
    message: 'Khoảng thời gian này trùng với một giấc ngủ bạn đã ghi trước đó.',
  },
  'progress.sleep_quality_invalid': {
    message: 'Bạn chọn lại chất lượng giấc ngủ giúp mình nhé.',
  },
  'progress.weight_out_of_bounds': {
    message: 'Cân nặng cần nằm trong khoảng 25 – 300 kg.',
  },
  'progress.biomarker_out_of_bounds': {
    message: 'Có chỉ số nằm ngoài khoảng cho phép. Bạn kiểm tra lại các số đã nhập nhé.',
  },
  'progress.blood_pressure_pair_required': {
    message: 'Bạn cần nhập cả huyết áp tâm thu (số trên) và tâm trương (số dưới).',
  },
  'progress.systolic_must_exceed_diastolic': {
    message: 'Huyết áp tâm thu (số trên) phải lớn hơn tâm trương (số dưới).',
  },

  // Chung
  'validation.failed': {
    message: 'Một vài thông tin chưa hợp lệ. Bạn kiểm tra lại giúp mình nhé.',
  },
  'system.unauthorized': {
    message: 'Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại.',
    action: LOGIN_ACTION,
  },
  'system.forbidden': { message: 'Bạn không có quyền thực hiện thao tác này.' },
  'system.not_found': { message: 'Không tìm thấy dữ liệu bạn cần. Có thể nó đã bị xóa.' },
  'system.conflict': {
    message: 'Dữ liệu vừa được thay đổi ở nơi khác. Bạn tải lại trang rồi thử lại nhé.',
  },
  'system.service_unavailable': { message: TEMPORARY },
  'system.internal': { message: 'Đã có lỗi ngoài ý muốn. Bạn vui lòng thử lại sau ít phút.' },
};

/** Thông báo theo HTTP status khi không có `code` quen thuộc. */
export function friendlyMessageForStatus(status: number | undefined): string | undefined {
  if (status === undefined) return undefined;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu bạn cần.';
  if (status === 409) return 'Dữ liệu vừa được thay đổi. Bạn tải lại trang rồi thử lại nhé.';
  if (status === 429) return 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại nhé.';
  if (status >= 500) return TEMPORARY;
  return undefined;
}

export const NETWORK_ERROR_MESSAGE =
  'Không kết nối được tới Longevia. Bạn kiểm tra kết nối mạng rồi thử lại nhé.';

/**
 * Máy chủ vẫn phản hồi nhưng xử lý lâu hơn thời gian client chờ.
 * Tách khỏi `NETWORK_ERROR_MESSAGE` để không đổ lỗi sai cho mạng người dùng.
 */
export const TIMEOUT_ERROR_MESSAGE =
  'Longevia đang xử lý lâu hơn bình thường nên yêu cầu đã tạm dừng. Bạn thử lại sau ít phút nhé.';

export const DEFAULT_ERROR_MESSAGE = 'Có lỗi xảy ra. Bạn vui lòng thử lại nhé.';
