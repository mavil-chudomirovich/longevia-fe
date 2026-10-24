import { describe, it, expect } from 'vitest';
import {
  extractYouTubeId,
  youtubeThumbnailFromUrl,
  isSafeImageSrc,
  isAllowedImageHost,
  resolveVideoCover,
  VIDEO_FALLBACK_COVER,
} from './safe-image';

describe('safe-image utils', () => {
  it('chỉ chấp nhận ID YouTube đúng 11 ký tự', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=mushroom001')).toBe('mushroom001');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    // ID ngắn/dài bất thường → null để rớt về fallback thay vì thumbnail 404.
    expect(extractYouTubeId('https://www.youtube.com/watch?v=sample123456')).toBeNull();
    expect(extractYouTubeId('https://www.youtube.com/watch?v=abc')).toBeNull();
    expect(extractYouTubeId(null)).toBeNull();
  });

  it('đổi watch URL hợp lệ sang thumbnail i.ytimg.com', () => {
    expect(youtubeThumbnailFromUrl('https://www.youtube.com/watch?v=mushroom001')).toBe(
      'https://i.ytimg.com/vi/mushroom001/hqdefault.jpg'
    );
    expect(youtubeThumbnailFromUrl('https://example.com/cover.jpg')).toBeNull();
  });

  it('chặn URL video/blob khỏi next/image', () => {
    expect(isSafeImageSrc('https://www.youtube.com/watch?v=mushroom001')).toBe(false);
    expect(isSafeImageSrc('blob:http://localhost:3000/abc')).toBe(false);
    expect(isSafeImageSrc('https://i.ytimg.com/vi/mushroom001/hqdefault.jpg')).toBe(true);
    expect(isSafeImageSrc('https://images.unsplash.com/photo-123?w=800')).toBe(true);
    expect(isSafeImageSrc('/logo/logo-mark.png')).toBe(true);
    expect(isSafeImageSrc('')).toBe(false);
  });

  it('phân biệt host đã khai báo next.config với host lạ/blob', () => {
    expect(isAllowedImageHost('https://i.ytimg.com/vi/mushroom001/hqdefault.jpg')).toBe(true);
    expect(isAllowedImageHost('https://res.cloudinary.com/demo/cover.jpg')).toBe(true);
    expect(isAllowedImageHost('/logo/logo-mark.png')).toBe(true);
    // Host lạ / blob: preview → SafeImage rẽ sang <img> thường, khỏi crash next/image.
    expect(isAllowedImageHost('https://example.com/cover.jpg')).toBe(false);
    expect(isAllowedImageHost('https://cdn.nguoidung.vn/anh.jpg')).toBe(false);
    expect(isAllowedImageHost('blob:http://localhost:3000/abc')).toBe(false);
    expect(isAllowedImageHost('')).toBe(false);
  });

  it('resolveVideoCover ưu tiên ảnh hợp lệ, fallback khi URL xấu', () => {
    const cover = 'https://res.cloudinary.com/demo/cover.jpg';
    expect(resolveVideoCover(cover)).toBe(cover);
    // Watch URL không phải ảnh → resolve ra thumbnail (lớp SafeImage onError
    // sẽ tiếp tục rớt về fallback nếu thumbnail 404 runtime).
    expect(resolveVideoCover('https://www.youtube.com/watch?v=mushroom001')).toBe(
      'https://i.ytimg.com/vi/mushroom001/hqdefault.jpg'
    );
    expect(resolveVideoCover('blob:preview')).toBe(VIDEO_FALLBACK_COVER);
    expect(resolveVideoCover(null)).toBe(VIDEO_FALLBACK_COVER);
  });
});
