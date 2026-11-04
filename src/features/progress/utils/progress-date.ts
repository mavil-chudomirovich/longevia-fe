/**
 * Centralized Date & Time Utilities for Progress Module
 * Tuân thủ tuyệt đối Q01 / ADR005: Canonical UTC Business Calendar Policy.
 *
 * - Ngày server-derived tự động (today/week) dùng UTC date.
 * - Ngày DateOnly do người dùng chủ động chọn được giữ nguyên (YYYY-MM-DD).
 * - Mọi timestamp gửi lên backend là ISO 8601 instant với explicit 'Z'.
 * - Thời gian hiển thị cho người dùng ở dạng múi giờ địa phương (Việt Nam) rõ ràng.
 * - Khoảng thời gian (fasting/sleep) tính theo chênh lệch instant (mili-giây), không trừ wall-clock.
 */

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo lịch UTC.
 * Ví dụ: 00:30 ngày 05/11 tại Việt Nam (UTC+7) -> '2026-11-04' (vì UTC mới là 17:30 ngày 04/11).
 * Đến 07:00 ngày 05/11 tại Việt Nam (UTC+7) -> '2026-11-05' (UTC chạm 00:00 ngày 05/11).
 */
export function getUtcTodayDateString(referenceDate?: Date): string {
  const d = referenceDate ?? new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chuẩn hóa một Date/chuỗi thành ISO 8601 UTC Instant (luôn kết thúc bằng 'Z').
 */
export function toUtcInstantIsoString(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date input for toUtcInstantIsoString: ${input}`);
  }
  return date.toISOString();
}

/**
 * Parse chuỗi YYYY-MM-DD thành Date đại diện cho 00:00:00 UTC của ngày đó.
 * Tránh việc Date constructor mặc định parse theo local timezone gây lệch ngày.
 */
export function parseUtcDateOnly(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid DateOnly string (expected YYYY-MM-DD): ${dateString}`);
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const timestamp = Date.UTC(year, month, day, 0, 0, 0, 0);
  return new Date(timestamp);
}

/**
 * Hiển thị ngày dạng YYYY-MM-DD sang định dạng quen thuộc Việt Nam: DD/MM/YYYY.
 */
export function formatDateOnlyDisplay(dateString: string | null | undefined): string {
  if (!dateString) return 'Chưa có';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Hiển thị một ISO instant sang ngày giờ địa phương tiếng Việt: 'HH:mm - dd/MM/yyyy'.
 */
export function formatDisplayDateTime(instant: Date | string | null | undefined): string {
  if (!instant) return 'Chưa ghi nhận';
  const d = instant instanceof Date ? instant : new Date(instant);
  if (isNaN(d.getTime())) return 'Không hợp lệ';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

/**
 * Hiển thị giờ phút địa phương: 'HH:mm'.
 */
export function formatDisplayTime(instant: Date | string | null | undefined): string {
  if (!instant) return '--:--';
  const d = instant instanceof Date ? instant : new Date(instant);
  if (isNaN(d.getTime())) return '--:--';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Tính số giờ chính xác giữa hai instant dựa trên mili-giây tuyệt đối.
 */
export function calculateInstantDifferenceHours(
  startInstant: Date | string,
  endInstant: Date | string
): number {
  const start = startInstant instanceof Date ? startInstant : new Date(startInstant);
  const end = endInstant instanceof Date ? endInstant : new Date(endInstant);

  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Định dạng số giờ (thập phân) thành chuỗi tiếng Việt dễ hiểu: 'X giờ Y phút' hoặc 'X giờ'.
 * Ví dụ: 16.5 -> '16 giờ 30 phút'; 8 -> '8 giờ'; 0.25 -> '15 phút'.
 */
export function formatDurationHours(hours: number): string {
  if (hours <= 0) return '0 phút';

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m} phút`;
  }
  if (m === 0) {
    return `${h} giờ`;
  }
  return `${h} giờ ${m} phút`;
}

/**
 * Kiểm tra xem một instant có ở tương lai hay không (với sai số dung sai cho phép).
 * Khớp với backend validator: <= TimeProvider.GetUtcNow().AddMinutes(toleranceMinutes)
 */
export function isFutureInstant(instant: Date | string, toleranceMinutes: number = 1): boolean {
  const d = instant instanceof Date ? instant : new Date(instant);
  const now = new Date();
  const maxAllowedMs = now.getTime() + toleranceMinutes * 60 * 1000;
  return d.getTime() > maxAllowedMs;
}

/**
 * Chuyển đổi Date/ISO instant sang giá trị cho HTML `<input type="datetime-local">` (local time 'YYYY-MM-DDTHH:mm').
 */
export function toLocalInputDateTimeString(dateInput?: Date | string | null): string {
  const d = dateInput ? (dateInput instanceof Date ? dateInput : new Date(dateInput)) : new Date();
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Chuyển giá trị từ HTML `<input type="datetime-local">` ('YYYY-MM-DDTHH:mm')
 * sang chuỗi ISO 8601 UTC instant có 'Z' để gửi lên backend.
 */
export function localInputToUtcIsoString(localDateTimeString: string): string {
  if (!localDateTimeString) {
    throw new Error('localDateTimeString cannot be empty');
  }
  const date = new Date(localDateTimeString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid local datetime string: ${localDateTimeString}`);
  }
  return date.toISOString();
}

/**
 * Tính số mili-giây còn lại cho đến mốc 00:00:00 UTC tiếp theo (UTC Midnight Rollover).
 * Dùng cho scheduler tự động làm mới dữ liệu chu kỳ ngày (nước uống, dashboard).
 */
export function getMsUntilNextUtcMidnight(referenceDate?: Date): number {
  const d = referenceDate ?? new Date();
  const nextMidnightUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, nextMidnightUtc - d.getTime());
}
