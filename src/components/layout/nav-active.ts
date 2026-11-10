/**
 * Trả về href của mục nav khớp sâu nhất với pathname hiện tại.
 *
 * Quy tắc:
 * - Khớp chính xác (sau khi bỏ trailing slash, trừ `/`).
 * - Hoặc pathname nằm trong thư mục con của href (`href + '/'`), không khớp
 *   tiền tố mù như `/dietary` với `/diet`.
 * - Nhiều mục cùng khớp (ví dụ `/diet` và `/diet/suggestions`) → chọn href dài
 *   nhất để chỉ highlight đúng một mục.
 */
export function getActiveNavHref(pathname: string, hrefs: readonly string[]): string | undefined {
  const current = normalizePathname(pathname);

  return hrefs
    .filter((href) => matches(current, normalizePathname(href)))
    .sort((a, b) => b.length - a.length)[0];
}

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? '/';
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.replace(/\/+$/, '') || '/';
  }
  return withoutQuery;
}

function matches(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
