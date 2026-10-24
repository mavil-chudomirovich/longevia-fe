/**
 * Tiện ích lọc URL ảnh an toàn cho `next/image`.
 * Ngăn URL video (youtube watch, blob:, ...) lọt vào `Image src`
 * gây lỗi "Invalid src prop" / "hostname is not configured".
 */

export const VIDEO_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80';

const UNSAFE_PATTERNS = ['youtube.com/watch', 'youtu.be', 'youtube-nocookie.com', 'blob:'];

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Hỗ trợ watch?v=, youtu.be/, embed/, shorts/, v/, &v=
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const id = match?.[2] ?? null;
  // ID YouTube thật luôn đúng 11 ký tự. Siết chuẩn này để giảm thumbnail 404;
  // ID giả mạo đúng 11 ký tự nhưng không tồn tại (VD: mushroom001) vẫn cần
  // lớp phòng thủ runtime `SafeImage onError` vì không thể biết trước qua regex.
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  return null;
}

export function youtubeThumbnailFromUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Mirror của `images.remotePatterns` trong `next.config.ts`.
 * `next/image` throw lỗi ngay lúc render (không bắt được bằng onError) khi
 * hostname chưa khai báo → `SafeImage` dùng danh sách này để rẽ sang `<img>`
 * thường cho host lạ. Thêm host mới trong next.config thì nhớ thêm ở đây.
 */
export const ALLOWED_IMAGE_HOSTNAMES: ReadonlySet<string> = new Set([
  'images.unsplash.com',
  'api.dicebear.com',
  'lh3.googleusercontent.com',
  'res.cloudinary.com',
  'i.pravatar.cc',
  'i.ytimg.com',
  'img.youtube.com',
]);

/** `true` nếu src dùng được trực tiếp trong `next/image` (local, data:, hoặc host đã khai báo). */
export function isAllowedImageHost(src: string | null | undefined): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (trimmed === '') return false;
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('data:image')) return true;
  // blob: preview tạm và host lạ → rẽ sang <img> thường, không qua optimizer.
  if (trimmed.startsWith('blob:')) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return ALLOWED_IMAGE_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
  }
}

/** `true` nếu URL có thể đưa trực tiếp vào `next/image` (http/https, không phải link video). */
export function isSafeImageSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (trimmed === '') return false;
  // Ảnh local trong public/
  if (trimmed.startsWith('/')) return true;
  // Cho phép data:image (blur placeholder) nhưng chặn blob: (preview tạm).
  if (trimmed.startsWith('data:image')) return true;
  if (trimmed.startsWith('blob:')) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  // Chặn link xem video YouTube (watch, shorts, live...) — chỉ thumbnail i.ytimg mới là ảnh.
  if (UNSAFE_PATTERNS.some((p) => trimmed.includes(p))) {
    // Cho phép thumbnail YouTube chuẩn.
    if (parsed.hostname === 'i.ytimg.com' || parsed.hostname === 'img.youtube.com') return true;
    return false;
  }
  return true;
}

/**
 * Chuẩn hoá ảnh bìa video:
 * - URL ảnh hợp lệ → giữ nguyên.
 * - URL YouTube watch/shorts → đổi sang thumbnail `i.ytimg.com` (đã khai báo remotePatterns).
 * - Ngược lại → fallback.
 */
export function resolveVideoCover(
  coverImageUrl: string | null | undefined,
  fallback: string = VIDEO_FALLBACK_COVER
): string {
  if (isSafeImageSrc(coverImageUrl)) return (coverImageUrl as string).trim();
  const thumb = youtubeThumbnailFromUrl(coverImageUrl);
  if (thumb) return thumb;
  return fallback;
}
