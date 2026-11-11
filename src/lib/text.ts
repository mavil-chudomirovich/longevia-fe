/**
 * Chuẩn hoá chuỗi để so khớp không phân biệt hoa/thường và dấu tiếng Việt.
 *
 * Dùng cho so khớp dị ứng ở phía client. Không dùng để hiển thị: chuỗi hiển thị
 * phải giữ nguyên dấu gốc.
 */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tách thành các token chữ/số để so khớp theo từ, tránh "cá" khớp "cà chua". */
export function textTokens(value: string | null | undefined): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}
