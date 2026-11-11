import { redirect } from 'next/navigation';

/**
 * `/register` từng trả 404 vì đăng ký chỉ nằm trong tab của `/login`.
 * Giữ đường dẫn quen thuộc này hoạt động bằng cách chuyển sang tab đăng ký.
 */
export default function RegisterRedirectPage() {
  redirect('/login?tab=register');
}
