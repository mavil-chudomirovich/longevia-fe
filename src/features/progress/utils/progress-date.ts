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

import { getBusinessTodayDateString, getMsUntilNextBusinessMidnight } from '@/lib/business-date';
import { ProgressDataIntegrityError } from '../errors/progress-data-integrity.error';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

const ISO_8601_STRICT_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|([+-])(\d{2})(?::?(\d{2}))?)$/i;

/**
 * Phân tích cú pháp timestamp bắt buộc theo tiêu chuẩn ISO 8601 tuyệt đối có múi giờ (Corrective A).
 * - Chấp nhận chuỗi ISO 8601 có explicit timezone ('Z' hoặc offset hợp lệ).
 * - Chấp nhận đối tượng Date hợp lệ.
 * - Từ chối giá trị rỗng/null/undefined (ném ProgressDataIntegrityError).
 * - Từ chối chuỗi timestamp không có múi giờ (không chấp nhận giả định local time).
 * - Từ chối ngày lịch bất khả thi (VD: 30/02) thay vì để JS Date tự động nhảy tháng.
 * - Từ chối offset múi giờ bất khả thi (VD: +25:00).
 * - Tuyệt đối không thay thế bằng thời gian hiện tại khi dữ liệu backend bị lỗi.
 */
export function parseRequiredInstant(
  value: unknown,
  fieldName: string,
  resourceName?: string
): Date {
  if (value === null || value === undefined || value === '') {
    throw new ProgressDataIntegrityError(
      fieldName,
      'PROGRESS_MISSING_REQUIRED_FIELD',
      resourceName,
      `Thiếu trường thời gian bắt buộc: ${fieldName}`
    );
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
    }
    return value;
  }

  if (typeof value !== 'string') {
    throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
  }

  const trimmed = value.trim();
  const match = ISO_8601_STRICT_REGEX.exec(trimmed);
  if (!match) {
    throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);

  if (month < 1 || month > 12) {
    throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
  }

  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
  }

  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
  }

  // Kiểm tra offset múi giờ
  const offsetSign = match[9];
  if (offsetSign) {
    const offsetHours = Number(match[10]);
    const offsetMinutes = match[11] ? Number(match[11]) : 0;
    if (offsetHours > 14 || offsetMinutes > 59) {
      throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
    }
    if (offsetHours === 14 && offsetMinutes > 0) {
      throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
    }
  }

  const parsedDate = new Date(trimmed);
  if (isNaN(parsedDate.getTime())) {
    throw new ProgressDataIntegrityError(fieldName, 'PROGRESS_INVALID_TIMESTAMP', resourceName);
  }

  return parsedDate;
}

/**
 * Ngày nghiệp vụ YYYY-MM-DD theo ADR006 (local, mặc định Asia/Ho_Chi_Minh).
 * Giữ tên cũ để không phá call site; code mới nên dùng
 * `getBusinessTodayDateString` từ `@/lib/business-date`.
 */
export function getUtcTodayDateString(referenceDate?: Date): string {
  return getBusinessTodayDateString(referenceDate);
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
  return getMsUntilNextBusinessMidnight(referenceDate);
}
