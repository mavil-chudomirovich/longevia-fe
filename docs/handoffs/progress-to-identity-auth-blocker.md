# Báo cáo rào cản tích hợp Auth (Identity Frontend Blocker) & Bàn giao liên module

> **Người báo cáo:** Bảo — Progress Service & Frontend Owner (Dev 3)  
> **Người nhận bàn giao:** Nguyên — Identity Service & Frontend Owner (Dev 1)  
> **Đồng kính gửi:** Huy (Dev 2 - Diet), Đức (Dev 4 - Recommendation), Duy (Dev 5 - Deployment/Gateway)  
> **Ngày lập:** 04/11/2026  
> **Trạng thái:** `PENDING_IDENTITY_AUTH_ALIGNMENT`

---

## 1. Tóm tắt tình trạng

Module **Progress & Biomarkers Frontend** (Tiến trình & Chỉ số sinh học) đã được triển khai hoàn chỉnh 100% theo chuẩn kiến trúc 7 tầng, tích hợp 9 canonical HTTP endpoints của Progress Service, phân lập cache đa người dùng (User-isolated Query Keys), cơ chế tự động chuyển ngày UTC Midnight (00:00 UTC) và vượt qua toàn bộ 111 tests cùng TypeScript/Next.js production build.

Tuy nhiên, **quá trình kiểm thử tích hợp trực tiếp trên trình duyệt (Live Browser Smoke Test)** hiện đang bị gián đoạn do sự bất đồng bộ giữa Auth Frontend hiện tại và hợp đồng API thực tế của Identity Backend.

Bảo tuân thủ nghiêm ngặt ranh giới sở hữu mã nguồn (Ownership Boundary), không tự ý chỉnh sửa module Auth của Nguyên, và lập tài liệu bàn giao này để mô tả chi tiết rào cản cùng hướng giải quyết đề xuất.

---

## 2. Chi tiết bất đồng bộ hợp đồng (Contract Incompatibility)

### 2.1. Phản hồi thực tế từ Identity Backend (`longevia-be`)

Theo mã nguồn backend tại `src/Services/Identity/Identity.Api/Endpoints/AuthEndpoints.cs`:

- Endpoint `POST /api/auth/login` và `POST /api/auth/register` trả về HTTP 200/201 với cấu trúc JSON phẳng (flat object):
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "488f58d0-9a3b-4c28-984e-5a02be041c3a",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
  ```
- Backend **không bọc** trong `{ data: { ... } }`.
- Backend **không trả về** object `user` (`id`, `displayName`, `email`, `role`) trong response payload của login/register.
- Backend hiện tại chưa cung cấp endpoint `GET /api/auth/profile` hoặc `GET /api/auth/me`.

### 2.2. Kỳ vọng hiện tại của Auth Frontend (`src/features/auth/*`)

- Scaffold Auth FE hiện tại tại `src/features/auth/api/auth.api.ts` và `src/features/auth/types/auth.dto.ts` đang kỳ vọng:
  ```typescript
  interface AuthResponseDto {
    user: UserDto;
    accessToken: string;
  }
  ```
  Và đọc qua `response.data.data.user`.
- Hệ quả: Khi gọi API backend thực tế, mapper ném lỗi không tìm thấy `user`, khiến token không được lưu vào memory và `useAuthStore` không hydrate được `user.id`.
- Khi không có `user.id`, các query của module Progress (và sau này là Diet/Recommendation) sẽ bị vô hiệu hóa (`enabled: false`) theo đúng cơ chế bảo vệ phân lập dữ liệu người dùng.

---

## 3. Kiến nghị giải pháp cho Nguyên (Dev 1 - Identity Owner)

Để Auth Frontend tương thích 100% với Identity Backend thực tế mà không cần chờ backend sửa đổi, kiến nghị Nguyên thực hiện các bước sau trong module `src/features/auth`:

1. **Cập nhật DTO & Mapper Auth:**
   - Điều chỉnh `LoginResponseDto` và `RegisterResponseDto` khớp với flat payload:
     ```typescript
     export interface AuthTokenResponseDto {
       accessToken: string;
       refreshToken: string;
       tokenType: string;
       expiresIn: number;
     }
     ```
2. **Khởi tạo User Model từ JWT Claims (Client-side Decode):**
   - Do backend không trả về `user` trong body và chưa có `/api/auth/me`, Auth Mapper có thể decode payload của `accessToken` (chuỗi base64 giữa 2 dấu chấm) để trích xuất:
     - `sub` / `nameid` -> `user.id` (GUID)
     - `email` -> `user.email`
     - `name` / `unique_name` -> `user.displayName`
     - `role` -> `user.role`
   - Nhờ vậy, `useAuthStore.getState().setSession(token, user)` sẽ có đầy đủ `user.id` hợp lệ.
3. **Bổ trợ dọn dẹp Cache toàn cục khi Logout:**
   - Phía Progress đã triển khai phân lập cache theo `userId` (`progressKeys.user(userId)`), tự hủy query cũ khi mount và lắng nghe auth store qua `ProgressCacheSync`.
   - Để đạt mức bảo vệ 100% chủ động ngay tại thời điểm người dùng ấn nút "Đăng xuất" trên Header:
     ```typescript
     // Trong src/store/useAuthStore.ts hoặc hook useAuth.ts:
     import { clearProgressCache } from '@/features/progress/queries/progress.queries';

     // Trong action logout():
     logout: () => {
       clearAccessToken();
       // Tùy chọn: gọi clearProgressCache(queryClient) nếu có sẵn instance
       set({ token: null, user: null, isAuthenticated: false });
     };
     ```

---

## 4. Tác động và Trạng thái hoàn thành của Module Progress

- **Toàn bộ chức năng Progress:** Hoàn thành 100%, sẵn sàng chạy ngay khi Auth hoàn tất việc lưu session và `user.id`.
- **Mã nguồn Progress:** Tuân thủ 100% quy tắc phân lập (không rò rỉ dữ liệu giữa user A và user B), quản lý lỗi rõ ràng (Loading/Error/Empty/Success) và không tạo bất kỳ thay đổi nào vi phạm quyền sở hữu module của Nguyên.
