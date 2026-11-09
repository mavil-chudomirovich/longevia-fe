/**
 * Backend trả `usedFallbackReason` khi phải dùng phương án dự phòng thay cho AI.
 * Hiển thị đúng nguyên nhân giúp người dùng biết nên thử lại, đổi tuần, hay báo
 * quản trị viên nạp kho tri thức — thay vì câu chung "AI không sẵn sàng".
 */
export interface AiFallbackDescription {
  message: string;
  /** Người dùng có thể thử lại ngay và có khả năng thành công. */
  retryable: boolean;
}

const FALLBACK_MESSAGES: Record<string, AiFallbackDescription> = {
  provider_timeout: {
    message:
      'AI phản hồi quá lâu nên Longevia đã dùng phương án dự phòng. Bạn có thể thử lại, hoặc giảm số ngày/bữa để AI trả lời nhanh hơn.',
    retryable: true,
  },
  provider_unavailable: {
    message:
      'Dịch vụ AI tạm thời không sẵn sàng nên Longevia đã dùng phương án dự phòng. Bạn thử lại sau ít phút nhé.',
    retryable: true,
  },
  invalid_model_output: {
    message:
      'AI trả về lựa chọn không hợp lệ nên Longevia đã dùng phương án dự phòng an toàn. Bạn thử tạo lại kế hoạch nhé.',
    retryable: true,
  },
  corpus_missing: {
    message:
      'Kho tri thức của sách chưa được nạp nên chưa thể dùng AI. Kế hoạch dưới đây là phương án dự phòng; quản trị viên cần nạp corpus.',
    retryable: false,
  },
  no_safe_activity: {
    message:
      'Không còn hoạt động nào phù hợp với giới hạn sức khỏe bạn đã khai, nên kế hoạch dùng khung an toàn (nghỉ hoặc vận động nhẹ).',
    retryable: false,
  },
};

const GENERIC_FALLBACK: AiFallbackDescription = {
  message:
    'Kế hoạch dùng phương án dự phòng vì AI chưa tạo được kết quả phù hợp. Bạn thử lại sau giây lát nhé.',
  retryable: true,
};

export function describeAiFallback(reason: string | null | undefined): AiFallbackDescription {
  if (!reason) return GENERIC_FALLBACK;
  return FALLBACK_MESSAGES[reason] ?? GENERIC_FALLBACK;
}
