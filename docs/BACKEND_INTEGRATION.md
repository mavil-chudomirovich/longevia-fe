# Tích hợp Frontend – Backend Longevia

## Gateway và quy ước chung

Trình duyệt gọi cùng origin qua Next.js. Rewrite `/api/:path*` chuyển tiếp tới Nginx Gateway (mặc định `http://localhost:8080`); gateway định tuyến `/api/identity/**`, `/api/diet/**` và `/api/progress/**`, rồi bỏ prefix service trước khi gọi backend. Recommendation là gRPC-only, không có route client-facing.

API trả JSON phẳng, không có `{ data }` envelope. Lỗi dùng Problem Details với `code` ở cấp gốc và `errors: [{ field, message }]` nếu có. Identity validation trả `422 identity.validation_failed`; Diet/Progress validation trả `400 validation.failed`. FE rẽ nhánh theo `code`, không phân tích câu `detail`. Enum là chuỗi. Ngày nghiệp vụ mặc định dùng UTC.

## Identity và phiên đăng nhập

API service routes dưới `/api/identity`:

| Method | Path | Hành vi FE |
| --- | --- | --- |
| POST | `/auth/register` | Gửi `email`, `password`, `fullName`; nhận `201 UserResponse`, không đăng nhập tự động |
| GET | `/auth/verify?token=...` | Xác thực email; thành công `204` |
| POST | `/auth/login` | BFF gọi Identity; nhận cặp token, chỉ trả access token cho client |
| POST | `/auth/refresh` | BFF đọc refresh token từ HttpOnly cookie, xoay token và cập nhật cookie |
| POST | `/auth/logout` | BFF gửi Bearer + refresh token, luôn xóa cookie cục bộ |
| POST | `/auth/change-password` | Gửi `currentPassword`, `newPassword`; thành công `204` và backend thu hồi refresh sessions |
| POST | `/auth/forgot-password` | Gửi email; luôn nhận `202`, không tiết lộ email có tài khoản hay không |
| POST | `/auth/reset-password` | Gửi mã 64-hex và `newPassword`; thành công `204` |
| GET | `/users/me` | Đọc `id`, `email`, `fullName`, `status`, `createdAt`, `profile` |
| PUT | `/users/me/profile` | Gửi hồ sơ sức khỏe; thành công trả `ProfileResponse` |

Next BFF routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh-token`, `/api/auth/logout`. Cookie `lv_rt` là HttpOnly, giới hạn path `/api/auth`, sống 7 ngày; `lv_at` là HttpOnly ở path `/` theo thời hạn access token. `lv_session_hint` là cookie không HttpOnly, không chứa token, để middleware và client biết nên thử silent refresh; API vẫn yêu cầu Bearer JWT. Access token cho API chỉ nằm trong memory của client. JWT access token hết hạn sau 15 phút; `lv_rt` cho phép silent refresh. Identity không phát role claim.

Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ thường, chữ số và ký tự đặc biệt. Các mã lỗi FE xử lý riêng: `identity.invalid_credentials`, `identity.user_suspended`, `identity.email_taken`, `identity.invalid_verification_token`, `identity.invalid_password_reset_token`, `identity.invalid_current_password`, `identity.validation_failed`.

## Diet

Mọi route dưới đây đi qua `/api/diet` và cần Bearer JWT.

| Method | Path | Trạng thái FE | Ghi chú |
| --- | --- | --- | --- |
| GET / POST | `/foods` | READY | Danh sách có tìm kiếm, lọc, phân trang; tạo món cá nhân |
| GET / PUT | `/targets/me` | READY | `diet.target_not_found` mở trạng thái chưa thiết lập; target thủ công kiểm tra 4P+4C+9F lệch calo tối đa ±5% |
| POST | `/targets/me/calculate` | READY | Backend tính từ hồ sơ và cân nặng; `bmr`/`tdee` null được giữ là null |
| POST | `/meals` | READY | Ghi ngày UTC, meal type và tối đa 100 món; không tự retry mutation |
| GET | `/meals/daily-summary?date=YYYY-MM-DD` | READY | Summary theo ngày; calo còn lại có thể âm |
| GET | `/meals/ai-recommendations?mealType=...&goal=...` | READY | Luôn hiện `disclaimer`/`safetyNote`; citation `verified=false` được ghi rõ; chỉ ghi log khi người dùng bấm |

Các mã lỗi được trình bày bằng UI: `diet.weight_not_found` → `/progress/metrics`; `diet.profile_not_found`/`diet.profile_incomplete` → `/profile`; `diet.no_safe_candidate` giải thích dữ liệu dị ứng và dẫn `/diet/foods`; `diet.ai_timeout`/`diet.ai_unavailable` cho phép thử lại; `diet.food_not_found` báo món không còn tồn tại. `400 validation.failed` gắn lỗi vào trường tương ứng. Seed hiện có 43 món dùng chung, tất cả đã khai báo dị ứng; AI vẫn có thể trả danh sách rỗng nếu mọi ứng viên đều trùng dị ứng trong hồ sơ.

## Progress

Các route dưới `/api/progress` cần Bearer JWT. FE đã nối đủ 9 business endpoints:

| Method | Path | Trạng thái FE |
| --- | --- | --- |
| GET | `/dashboard/summary` | READY |
| GET | `/fasting/current` | READY; **204 No Content** khi chưa có phiên (thay cho 200 body rỗng) |
| POST | `/fasting/start` | READY |
| POST | `/fasting/end` | READY |
| GET | `/water/today` | READY |
| POST | `/water/log` | READY |
| POST | `/sleep/log` | READY |
| POST | `/metrics` | READY |
| GET | `/metrics/history` | READY; phân trang không trả `hasPreviousPage`/`hasNextPage` |

Lỗi được phân nhánh theo mã: `progress.fasting_active_conflict`, `progress.fasting_not_found`, `progress.fasting_no_active`, `progress.sleep_overlap`, `progress.height_unavailable`, `progress.identity_unavailable`, `progress.identity_integration_failure`. Metrics cần chiều cao hồ sơ từ Identity. Ngày hôm nay, water, và khoảng tuần dùng lịch UTC; ngày lịch sử người dùng chọn được giữ nguyên.

## Hỏi sách chat & AI mục tiêu (duck-004)

### `/api/diet/knowledge`

| Method | Path | Trạng thái FE |
| --- | --- | --- |
| POST | `/ask/stream` | READY; SSE `delta` → `citation` → `done`/`error`, gọi qua BFF `/api/knowledge/ask/stream` |
| GET | `/conversations` | READY; `[{ id, title, messageCount, updatedAt }]` |
| GET | `/conversations/{id}` | READY; messages kèm citations |
| DELETE | `/conversations/{id}` | READY; 404 `diet.conversation_not_found` nếu không thuộc owner |

### `/api/diet/targets/me/suggest`

READY. Body `{ description?, goal? }`; trả `{ targetCalories, targetProteinGrams,
targetCarbsGrams, targetFatGrams, rationale, source, safetyNote }`. **Không ghi DB** —
FE điền form, người dùng bấm "Lưu thủ công" (`PUT /targets/me`) mới persist.
`source=formula` khi AI lỗi hoặc trả macro ngoài khoảng an toàn.

### Trường additive

- Meal plan & workout plan: `usedFallbackReason` (`provider_timeout`,
  `provider_unavailable`, `invalid_model_output`, `corpus_missing`, `no_safe_activity`).
- Workout day: `activityLabel` (tiếng Việt); ngày nghỉ để rỗng.
- Fasting current: 204 thay vì 200 body rỗng.

## Đồng bộ OpenAPI

Khi có JSON OpenAPI của service, chạy `npm run sync:swagger <đường-dẫn-hoặc-URL-json>` trong repo FE để cập nhật `docs/api-catalog.json`, `docs/API-CATALOG.md` và `docs/api/`. Swagger UI của gateway không phải JSON OpenAPI; dùng URL/file JSON do service hoặc deployment cung cấp.
