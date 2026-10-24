import { z } from 'zod';

/**
 * Validate env tập trung bằng zod. Mọi file khác import từ đây,
 * không đọc process.env rời rạc nữa.
 *
 * - NEXT_PUBLIC_*: dùng được cả client + server.
 * - BACKEND_API_URL: chỉ server (server-fetch, route handlers). Client = undefined.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL phải là URL hợp lệ')
    .default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL phải là URL hợp lệ')
    .default('http://localhost:3000'),
  BACKEND_API_URL: z.string().url('BACKEND_API_URL phải là URL hợp lệ').optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
    BACKEND_API_URL: process.env.BACKEND_API_URL || undefined,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    // Không throw để dev vẫn chạy được khi thiếu env; log warning rõ ràng.
    // Production nên set đủ env — check log khi deploy.
    console.warn(`[env] Env không hợp lệ (${issues}). Dùng giá trị mặc định.`);
    return envSchema.parse({});
  }
  return parsed.data;
}

export const env = loadEnv();

/** Base URL cho axios client (qua rewrites /api/v1 -> backend, cùng-domain giữ cookie). */
export const API_BASE_URL =
  typeof window !== 'undefined' ? '/api/v1' : env.NEXT_PUBLIC_API_URL || '/api/v1';

/** Base URL server-only cho server-fetch và route handlers (ưu tiên BACKEND_API_URL). */
export const BACKEND_URL = env.BACKEND_API_URL ?? env.NEXT_PUBLIC_API_URL;

export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
