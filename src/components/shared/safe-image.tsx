'use client';

import * as React from 'react';
import Image from 'next/image';
import { isAllowedImageHost } from '@/lib/safe-image';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  /** Ảnh dự phòng khi `src` 404 (thumbnail YouTube giả, host lạ, file đã xoá...). */
  fallbackSrc: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Bỏ qua bộ nén Next.js optimizer (bắt buộc cho CDN YouTube để tránh upstream 404). */
  unoptimized?: boolean;
  style?: React.CSSProperties;
}

/**
 * Wrapper ảnh an toàn cho nội dung do người dùng upload từ nhiều nguồn.
 *
 * Các lớp phòng thủ runtime:
 * 1. Host chưa khai báo trong `next.config.ts` / `blob:` preview → render
 *    `<img>` thường với fallback `onError`.
 * 2. Thumbnail YouTube (`i.ytimg.com`, `img.youtube.com`) tự động bật `unoptimized`
 *    để trình duyệt tải trực tiếp từ Google CDN thay vì qua proxy `/_next/image`.
 *    Khi video ID không tồn tại (như seed data demo hoặc link die), Next.js server
 *    sẽ KHÔNG bị lỗi "upstream image response failed 404" và client lập tức rớt về fallbackSrc.
 * 3. `onError` → tự động chuyển sang `fallbackSrc` khi link ảnh gốc 404.
 */
export function SafeImage({
  src,
  alt,
  fallbackSrc,
  fill = false,
  width,
  height,
  sizes,
  className,
  priority = false,
  unoptimized,
  style,
}: SafeImageProps) {
  const initialSrc = src && src.trim() !== '' ? src : fallbackSrc;
  const [currentSrc, setCurrentSrc] = React.useState<string>(initialSrc);

  // Reset khi `src` đổi (chuyển card, refetch...). Tránh kẹt ở fallback cũ.
  React.useEffect(() => {
    setCurrentSrc(src && src.trim() !== '' ? src : fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
  };

  const isYouTube = currentSrc.includes('i.ytimg.com') || currentSrc.includes('img.youtube.com');
  const shouldBeUnoptimized = unoptimized ?? isYouTube;

  // Nhánh host lạ: <img> thường + onError fallback (chế độ fill yêu cầu
  // parent `relative` đã có sẵn ở mọi call site, className gồm h-full w-full).
  if (!isAllowedImageHost(currentSrc)) {
    if (fill) {
      return (
        <img
          src={currentSrc}
          alt={alt}
          className={className}
          style={style}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={handleError}
        />
      );
    }
    return (
      <img
        src={currentSrc}
        alt={alt}
        width={width ?? 800}
        height={height ?? 450}
        className={className}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onError={handleError}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={shouldBeUnoptimized}
        className={className}
        style={style}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width ?? 800}
      height={height ?? 450}
      sizes={sizes}
      priority={priority}
      unoptimized={shouldBeUnoptimized}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}
