/**
 * Ngày nghiệp vụ phía browser (ADR006): dùng ngày local của người dùng, mặc định
 * là giờ Việt Nam khi chạy trên máy người dùng Việt Nam. Timestamp vẫn gửi dạng
 * ISO 8601 UTC; chỉ "ngày" mới dùng local để khớp backend Asia/Ho_Chi_Minh.
 */
export function getBusinessTodayDateString(referenceDate?: Date): string {
  const date = referenceDate ?? new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Thứ Hai (YYYY-MM-DD) của tuần chứa ngày truyền vào. */
export function getBusinessWeekStart(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return getBusinessTodayDateString(date);
}

/** Cộng/trừ số tuần, luôn trả về thứ Hai. */
export function addBusinessWeeks(weekStart: string, delta: number): string {
  const date = new Date(`${weekStart}T00:00:00`);
  date.setDate(date.getDate() + delta * 7);
  return getBusinessWeekStart(getBusinessTodayDateString(date));
}

/** Bảy ngày (YYYY-MM-DD) của tuần, bắt đầu từ thứ Hai. */
export function getBusinessWeekDays(weekStart: string): string[] {
  const monday = getBusinessWeekStart(weekStart);
  return Array.from({ length: 7 }, (_, index) => shiftDays(monday, index));
}

/** Nhãn tuần: "Tuần 10/11 – 16/11/2026". */
export function formatBusinessWeekRange(weekStart: string): string {
  const monday = getBusinessWeekStart(weekStart);
  const start = new Date(`${monday}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const short = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `Tuần ${short(start)} – ${short(end)}/${end.getFullYear()}`;
}

/** Tuần truyền vào có phải tuần hiện tại không. */
export function isCurrentBusinessWeek(weekStart: string, reference?: Date): boolean {
  return (
    getBusinessWeekStart(weekStart) === getBusinessWeekStart(getBusinessTodayDateString(reference))
  );
}

function shiftDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getBusinessTodayDateString(date);
}

/** Số mili giây tới nửa đêm local kế tiếp. */
export function getMsUntilNextBusinessMidnight(referenceDate?: Date): number {
  const now = referenceDate ?? new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}
