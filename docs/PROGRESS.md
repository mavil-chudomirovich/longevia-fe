# PROGRESS — Tiến độ triển khai Longevia Frontend

> File duy nhất theo dõi tiến độ hoàn thành tính năng theo trọng số. Cập nhật sau mỗi task.

## Cách tính % hoàn thành tính năng

Mỗi feature MVP = 100%, chia theo 7 bước scaffold (`docs/ARCHITECTURE.md`):

| Bước                        | Trọng số | Mô tả                                                                 |
| --------------------------- | -------- | --------------------------------------------------------------------- |
| 1. UI route + components    | 30%      | Giao diện, responsive, loading/error/empty states, tiếng Việt, shadcn |
| 2. DTO + Model interfaces   | 10%      | Định nghĩa contract DTO thô & UI Model sạch                           |
| 3. Mapper + Unit tests      | 20%      | `pickField` + `safe*`, kế thừa BaseMapper, kiểm thử                   |
| 4. API layer                | 15%      | Khai báo `api-endpoints` + `api/*.api.ts`, gọi axios, map dữ liệu     |
| 5. TanStack Queries         | 10%      | Query Key Factory, query/mutation hooks, cache invalidation           |
| 6. Form/Schema & Validation | 5%       | React Hook Form, Zod schema, validation messages tiếng Việt           |
| 7. Verification Gates       | 10%      | `tsc --noEmit`, `npm test`, `npm run build`                           |

---

## Bảng tổng hợp tiến độ

| #      | Feature / Module                        | Người phụ trách | Trạng thái                                | % Hoàn thành | Ghi chú                                                                                                                                                                                                                                                                                                                                             |
| ------ | --------------------------------------- | --------------- | ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **01** | **Core Foundation & Project Setup**     | Duy (Dev 5)     | Hoàn thành                                | 100%         | Next.js 16, React 19, Tailwind v4, shadcn/ui, Axios, TanStack Query, Vitest, Husky                                                                                                                                                                                                                                                                  |
| **02** | **App Shell & Theme Provider**          | Duy / Nguyên    | Hoàn thành                                | 100%         | Root layout, font Be Vietnam Pro, ThemeController, SiteHeader, SiteFooter; navbar chỉ highlight mục khớp sâu nhất (`/diet/suggestions` không còn sáng nhầm “Dinh dưỡng”). |
| **03** | **Authentication & Session Management** | FE integration  | Hoàn thành                                | 100%         | Dùng Identity thật qua BFF; đăng ký, xác thực email, login, refresh/logout, reset/đổi mật khẩu; không còn role giả hoặc OTP giả.                                                                                                                                                                                                                     |
| **04** | **Landing Page (Trang chủ)**            | Nguyên / Duy    | Hoàn thành                                | 100%         | Hero, 4 Trụ cột trường thọ, Tính năng nổi bật, Responsive, Dark/Light mode                                                                                                                                                                                                                                                                          |
| **05** | **Health Profile & Onboarding**         | FE integration  | Hoàn thành                                | 100%         | Hồ sơ sức khỏe theo Identity; cùng form được dùng cho onboarding và `/profile`, có đổi mật khẩu, đổi họ tên, đổi email (xác nhận qua email), giới tính "Khác" dùng BMR trung tính và giới hạn sức khỏe chọn nhanh/nhập tự do (tối đa 8 mục). |
| **06** | **Diet & Nutrition**                    | FE integration  | Hoàn thành                                | 100%         | Foods, mục tiêu một nút lưu (PUT tự đính kèm BMR/TDEE) và nút tự tính từ hồ sơ + goal, nhật ký bữa ăn theo ngày nghiệp vụ (ghi/sửa/xoá), gợi ý AI có cảnh báo an toàn và citations; kế hoạch tuần chọn bằng WeekPicker, AI-only không fallback; phân tích vi chất; Hỏi sách chat streaming có lịch sử; xoá custom food. |
| **07** | **Progress & Biomarkers**               | Bảo (Dev 3)     | Hoàn thành (PR #1 Final Corrective Ready) | 100%         | Dashboard, Fasting, Water, Sleep, Metrics, BMI snapshot, History chart; workout plan chọn tuần bằng WeekPicker, tự tải bản đã lưu, giới hạn sức khỏe chọn nhanh/nhập tự do + dụng cụ, 1–3 bài mỗi buổi ưu tiên theo goal; lịch sử nhịn ăn/nước/giấc ngủ; ngày nghiệp vụ theo giờ Việt Nam (ADR006). |
| **08** | **Today hub**                           | FE integration  | Hoàn thành                                | 100%         | `/today`: tổng hợp calo/bữa ăn, nước, nhịn ăn, giấc ngủ, bài tập hôm nay, cân nặng/streak, thói quen; quick actions ghi bữa ăn/thêm nước; navbar thêm “Hôm nay”. |

---

## Đợt sửa UX report — 2026-11-11

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| AI suggestions timeout & thông báo lỗi | Hoàn thành | Timeout request AI 60s; phân biệt timeout với mất mạng; copy “có thể mất tới 30 giây” |
| Validation native / dữ liệu rỗng | Hoàn thành | `noValidate` cho 4 form; bỏ mặc định cân nặng 70 kg và giấc ngủ 8h/quality mặc định |
| Việt hoá nhãn & ngày | Hoàn thành | Meal type, nhóm món, dị nguyên, ngày dd/mm/yyyy; bỏ “UTC/MVP/Systolic/Slept At” |
| Dị ứng | Hoàn thành | Cảnh báo + chặn lưu trong dialog ghi bữa; badge “Trùng dị ứng” trong danh mục món |
| Nhật ký ăn | Hoàn thành | Hiện chi tiết món, nhãn bữa, ngày; empty state khi chưa có mục tiêu; nút xoá bữa |
| Nước uống | Hoàn thành | Hoàn tác lần ghi gần nhất; mục tiêu theo cân nặng; copy đúng ngày nghiệp vụ |
| Onboarding & hồ sơ | Hoàn thành | “Bỏ qua”, bắt buộc chọn giới tính/vận động, thêm cân nặng + mục tiêu, card tài khoản read-only |
| Auth/email | Hoàn thành | `/register` redirect, hiện/ẩn mật khẩu, gửi lại xác minh, lỗi `email_not_verified`, email reset có link + giờ VN |
| Tìm món không dấu | Hoàn thành | BE dùng `unaccent`; “ca chua” → “Cà chua” |
| Giới tính “Khác”, đổi tên/email | Backlog | Cần đổi contract BMR/Identity; ghi nhận ngoài phạm vi đợt này |
