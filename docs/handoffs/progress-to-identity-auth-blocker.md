# Báo cáo rào cản tích hợp Auth — đã giải quyết

**Ngày cập nhật:** 08/11/2026
**Trạng thái:** `RESOLVED_AUTH_ALIGNMENT`

## Rào cản ban đầu

Auth FE cũ gọi alias `/api/auth/*`, chờ envelope `{ data: ... }`, dùng `displayName` khi đăng ký và giả định backend set cookie. Identity thực tế dùng `/api/identity/**`, trả JSON phẳng, nhận `fullName`, không set cookie và yêu cầu refresh/logout nhận refresh token trong body. Vì vậy FE không nạp được user hiện tại và các query Progress bị vô hiệu hóa.

## Cách giải quyết

- Định tuyến mọi Identity API qua gateway path `/identity/...`; auth session routes đi qua Next BFF `/api/auth/*`.
- BFF giữ `lv_rt` trong HttpOnly cookie, đồng bộ `lv_at` cho middleware và chỉ trả access token cho client. Client gọi `GET /identity/users/me` để nạp user thật; không decode role từ JWT.
- Đăng ký dùng `fullName` và không đăng nhập tự động trước khi xác thực email. Trang `/verify-email` gọi Identity verify endpoint.
- Middleware bảo vệ `/progress`, `/diet`, `/profile` và `/onboarding` dựa trên cookie phiên; bỏ role gates không có trong backend.
- `/onboarding` lưu hồ sơ qua `PUT /identity/users/me/profile`. `/profile` dùng cùng form và cung cấp đổi mật khẩu.
- Worker gửi link email về `${FRONTEND_BASE_URL}/verify-email?token=...`.

## Kết quả

Auth, Profile, Progress và Diet giờ dùng user ID từ Identity `GET /users/me`; query cache được cô lập theo user. Luồng xác thực và các verification gates của frontend được ghi nhận trong `docs/WORK-LOG.md` sau khi chạy.
