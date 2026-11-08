import { z } from 'zod';

/**
 * Validate env tập trung bằng zod. Mọi file khác import từ đây,
 * không đọc process.env rời rạc nữa.
 *
 * - NEXT_PUBLIC_*: dùng được cả client + server.
 * - BACKEND_API_URL: chỉ server (route handlers). Client = undefined.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL phải là URL hợp lệ')
    .default('http://localhost:8080/api'),
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
    console.warn(`[env] Env không hợp lệ (${issues}). Dùng giá trị mặc định.`);
    return envSchema.parse({});
  }
  return parsed.data;
}

export const env = loadEnv();

/** Base URL cho axios client (qua rewrites /api -> Gateway, cùng-domain giữ cookie). */
export const API_BASE_URL =
  typeof window !== 'undefined'
    ? '/api'
    : (env.BACKEND_API_URL ?? env.NEXT_PUBLIC_API_URL ?? '/api');

/** Base URL server-only cho route handlers (ưu tiên BACKEND_API_URL). */
export const BACKEND_URL = env.BACKEND_API_URL ?? env.NEXT_PUBLIC_API_URL;

export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
