# Tích hợp Frontend – Backend Longevia

## Gateway và quy ước chung

Trình duyệt gọi cùng origin qua Next.js. Rewrite `/api/:path*` chuyển tiếp tới Nginx Gateway (mặc định `http://localhost:8080`); gateway định tuyến `/api/identity/**`, `/api/diet/**` và `/api/progress/**`, rồi bỏ prefix service trước khi gọi backend. Recommendation là gRPC-only, không có route client-facing.

API trả JSON phẳng, không có `{ data }` envelope. Lỗi dùng Problem Details với `code` ở cấp gốc và `errors: [{ field, message }]` nếu có. Identity validation trả `422 identity.validation_failed`; Diet/Progress validation trả `400 validation.failed`. FE rẽ nhánh theo `code`, không phân tích câu `detail`. Enum là chuỗi. Ngày nghiệp vụ mặc định theo giờ Việt Nam (ADR006).

## Identity và phiên đăng nhập

API service routes dưới `/api/identity`:

| Method | Path | Hành vi FE |
| --- | --- | --- |
| POST | `/auth/register` | Gửi `email`, `password`, `fullName`; nhận **`202` không body** (pending Redis 1 giờ), không đăng nhập tự động |
| GET | `/auth/verify?token=...` | Xác thực email; thành công `204` |
| POST | `/auth/resend-verification` | Gửi lại email xác minh; **luôn `202`** kể cả email không tồn tại (chống dò tài khoản) |
| POST | `/auth/login` | BFF gọi Identity; nhận cặp token, chỉ trả access token cho client. Chưa xác minh → `403 identity.email_not_verified` |
| POST | `/auth/refresh` | BFF đọc refresh token từ HttpOnly cookie, xoay token và cập nhật cookie |
| POST | `/auth/logout` | BFF gửi Bearer + refresh token, luôn xóa cookie cục bộ |
| POST | `/auth/change-password` | Gửi `currentPassword`, `newPassword`; thành công `204` và backend thu hồi refresh sessions |
| POST | `/auth/forgot-password` | Gửi email; luôn nhận `202`, không tiết lộ email có tài khoản hay không |
| POST | `/auth/reset-password` | Gửi mã 64-hex và `newPassword`; thành công `204` |
| GET | `/users/me` | Đọc `id`, `email`, `fullName`, `status`, `createdAt`, `profile` |
| PUT | `/users/me/profile` | Gửi hồ sơ sức khỏe, gồm `healthLimitations` (tối đa 8 mục, mỗi mục ≤50 ký tự, nhập tự do); thành công trả `ProfileResponse` |
| PATCH | `/users/me` | Đổi họ tên hiển thị: `{ fullName }` (1–100 ký tự); trả `UserResponse` |
| POST | `/users/me/email-change` | Đổi email: gửi `{ newEmail, currentPassword }`, nhận `202`; cooldown 5 phút (`429 identity.email_change_too_frequent`), email đã dùng `409 identity.email_taken`, trùng email hiện tại `400 identity.email_unchanged`, sai mật khẩu `400 identity.invalid_current_password` |
| POST | `/auth/confirm-email-change` | Anon: gửi `{ token }` 64-hex từ email; thành công `204`, token sai/hết hạn/đã dùng `400 identity.invalid_email_change_token`; BE thu hồi mọi refresh token nên FE đăng xuất và về `/login?email-changed=success` |

Next BFF routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh-token`, `/api/auth/logout`. Cookie `lv_rt` là HttpOnly, giới hạn path `/api/auth`, sống 7 ngày; `lv_at` là HttpOnly ở path `/` theo thời hạn access token. `lv_session_hint` là cookie không HttpOnly, không chứa token, để middleware và client biết nên thử silent refresh; API vẫn yêu cầu Bearer JWT. Access token cho API chỉ nằm trong memory của client. JWT access token hết hạn sau 15 phút; `lv_rt` cho phép silent refresh. Identity không phát role claim.

Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ thường, chữ số và ký tự đặc biệt. Các mã lỗi FE xử lý riêng: `identity.invalid_credentials`, `identity.user_suspended`, `identity.email_taken`, `identity.invalid_verification_token`, `identity.invalid_password_reset_token`, `identity.invalid_current_password`, `identity.email_not_verified`, `identity.validation_failed`.

> Quyết định 2026-11-11: giữ `409 identity.email_taken` khi đăng ký trùng email để người dùng biết ngay và chuyển sang đăng nhập/quên mật khẩu; đây là đánh đổi có chủ đích (lộ email tồn tại ở luồng đăng ký), trong khi quên mật khẩu vẫn luôn trả `202`. Ghi rõ trong release note bảo mật.

## Diet

Mọi route dưới đây đi qua `/api/diet` và cần Bearer JWT.

| Method | Path | Trạng thái FE | Ghi chú |
| --- | --- | --- | --- |
| GET / POST | `/foods` | READY | Danh sách có tìm kiếm, lọc, phân trang; tạo món cá nhân |
| GET / PUT | `/targets/me` | READY | `diet.target_not_found` mở trạng thái chưa thiết lập; PUT tự đính kèm `bmr`/`tdee` khi có hồ sơ + cân nặng; target thủ công kiểm tra 4P+4C+9F lệch calo tối đa ±5% |
| POST | `/targets/me/calculate` | READY (legacy) | Client cũ; UI mới không dùng, vì `PUT` đã đính kèm BMR/TDEE |
| POST | `/targets/me/auto` | READY | Tính từ TDEE × goal hồ sơ (giảm cân 0.85, tăng cơ 1.10, còn lại 1.0), protein 1.4–1.8 g/kg, fat 25% calo; calo clamp 1.200–4.000, làm tròn 10 và lưu ngay |
| POST | `/meals` | READY | Ghi theo ngày nghiệp vụ, meal type và tối đa 100 món; không tự retry mutation |
| PUT | `/meals?date=YYYY-MM-DD&mealType=Breakfast` | READY | Thay thế toàn bộ món của bữa trong ngày: xoá log cũ + tạo log mới trong một transaction, phát removal + logged để streak đúng |
| GET | `/meals/daily-summary?date=YYYY-MM-DD` | READY | Summary theo ngày; `meals[].items[]` có tên món/khẩu phần/calo; calo còn lại có thể âm |
| DELETE | `/meals?date=YYYY-MM-DD&mealType=Breakfast` | READY | Xoá toàn bộ log cùng loại bữa trong ngày; idempotent (204 kể cả khi không còn bữa); `mealType` sai trả 400 `diet.invalid_meal_type` |
| GET | `/meals/ai-recommendations?mealType=...&goal=...` | READY | Luôn hiện `disclaimer`/`safetyNote`; citation `verified=false` được ghi rõ; chỉ ghi log khi người dùng bấm |

Các mã lỗi được trình bày bằng UI: `diet.weight_not_found` → `/progress/metrics`; `diet.profile_not_found`/`diet.profile_incomplete` → `/profile`; `diet.no_safe_candidate` giải thích dữ liệu dị ứng và dẫn `/diet/foods`; `diet.ai_timeout`/`diet.ai_unavailable` cho phép thử lại; `diet.food_not_found` báo món không còn tồn tại. `400 validation.failed` gắn lỗi vào trường tương ứng. Seed hiện có 43 món dùng chung, tất cả đã khai báo dị ứng; AI vẫn có thể trả danh sách rỗng nếu mọi ứng viên đều trùng dị ứng trong hồ sơ.

## Progress

Các route dưới `/api/progress` cần Bearer JWT. FE đã nối đủ 9 business endpoints:

| Method | Path | Trạng thái FE |
| --- | --- | --- |
| GET | `/dashboard/summary` | READY |
| GET | `/fasting/current` | READY; **204 No Content** khi chưa có phiên (thay cho 200 body rỗng) |
| GET | `/fasting/history?page&pageSize` | READY; phiên đã kết thúc, mới nhất trước, `pageSize` 1..50 |
| POST | `/fasting/start` | READY |
| POST | `/fasting/end` | READY |
| GET | `/water/today` | READY; `latestLogId` cho nút "Hoàn tác"; `targetMl` tính theo cân nặng gần nhất (35 ml/kg, kẹp 1.500–4.000), chưa có cân → 2.500 |
| GET | `/water/history?days=30` | READY; tổng theo ngày, `days` 1..90, cũ → mới |
| POST | `/water/log` | READY |
| DELETE | `/water/{id}` | READY; hoàn tác lần ghi của chính owner, trả summary mới; 404 `progress.water_log_not_found` |
| POST | `/sleep/log` | READY |
| PUT | `/sleep/{id}` | READY; sửa giờ ngủ/dậy + chất lượng, kiểm tra overlap trừ chính bản ghi; 404 `progress.sleep_not_found`, 409 `progress.sleep_overlap` |
| GET | `/sleep/history?page&pageSize` | READY; mới nhất trước, `pageSize` 1..50 |
| GET | `/sleep/today` | READY; giấc ngủ đêm qua, 204 nếu chưa ghi |
| DELETE | `/sleep/{id}` | READY; xoá bản ghi của owner |
| POST | `/metrics` | READY |
| GET | `/metrics/history` | READY; phân trang không trả `hasPreviousPage`/`hasNextPage` |

Lỗi được phân nhánh theo mã: `progress.fasting_active_conflict`, `progress.fasting_not_found`, `progress.fasting_no_active`, `progress.sleep_overlap`, `progress.height_unavailable`, `progress.identity_unavailable`, `progress.identity_integration_failure`. Metrics cần chiều cao hồ sơ từ Identity. Ngày hôm nay, water và khoảng tuần dùng **ngày nghiệp vụ ADR006** (mặc định giờ Việt Nam); ngày lịch sử người dùng chọn được giữ nguyên.

§ 4b. **Hỏi sách chat & AI mục tiêu (duck-004/005)**

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
FE điền form, người dùng bấm "Lưu mục tiêu" (`PUT /targets/me`) mới persist.
`source=formula` khi AI lỗi hoặc trả macro ngoài khoảng an toàn.

### Trường additive

- Meal plan: **không còn fallback**; lỗi AI trả 503 `recommendation.plan_generation_failed`
  (FE hiện nút thử lại). `warnings` chỉ còn corpus/dinh dưỡng/rule 105%.
  Generate có thể mất 30–90 giây nên request đặt timeout 150 giây.
- Workout plan: vẫn có `usedFallbackReason` (`provider_timeout`,
  `provider_unavailable`, `invalid_model_output`, `corpus_missing`, `no_safe_activity`).
  Request nhận `activityPreference`, `equipmentAvailable`, `limitations` (text tự do);
  response echo lại. Mỗi ngày có `activities[]` 1–3 bài (bài chính đầu tiên) và các field
  cũ `activity/activityLabel/...` giữ bài chính để tương thích.
- Goal ảnh hưởng thứ tự ưu tiên: `BuildMuscle` ưu tiên tập tạ/sức mạnh; `LoseWeight` ưu tiên
  cardio; `Longevity` ưu tiên vận động nhẹ. `limitations` free text được đưa vào prompt cho AI.
- Bỏ warning `no_limitations_assumed`/`unsupported_limitation`.
- Workout day: `activityLabel` (tiếng Việt); ngày nghỉ để rỗng.
- Fasting current: 204 thay vì 200 body rỗng.
- **Goal hồ sơ**: `ProfileResponse.goal` (LoseWeight/Maintain/BuildMuscle/Longevity) là mặc định
  cho gợi ý mục tiêu dinh dưỡng; `PUT /users/me/profile` nhận `goal` (không bắt buộc).
- **Tìm món không dấu**: `GET /foods?search=` dùng PostgreSQL `unaccent`, nên "ca chua" khớp
  "Cà chua" và "dau phong" khớp "Đậu phộng rang".
- **Gửi lại xác minh**: `POST /identity/auth/resend-verification` trả 202 cho mọi email
  (không tiết lộ tồn tại); đăng nhập khi chưa xác minh trả 403
  `identity.email_not_verified`.
- **Email reset**: có link bấm `/reset-password?token=...` kèm mã dự phòng, chào tên và giờ
  Việt Nam.
- **Đổi email**: `POST /identity/users/me/email-change` gửi link xác nhận tới địa chỉ mới
  (hạn 24 giờ) và cảnh báo tới địa chỉ cũ; trang `/confirm-email-change` xác nhận rồi đăng
  xuất vì BE thu hồi refresh token. Dialog nằm trong thẻ "Tài khoản" ở `/profile`.
- **Giới tính "Khác"**: hồ sơ nhận `Other`; BMR/TDEE dùng hệ số trung tính nên UI ghi rõ kết
  quả chỉ là ước lượng.
- **Ngày nghiệp vụ (ADR006)**: water/dashboard/meal summary/longevity/digest reset
  00:00 giờ `APP_TIMEZONE` (mặc định Việt Nam). FE gửi `DateOnly` local; timestamp
  vẫn ISO UTC. Không backfill dữ liệu cũ.

## Đồng bộ OpenAPI

Khi có JSON OpenAPI của service, chạy `npm run sync:swagger <đường-dẫn-hoặc-URL-json>` trong repo FE để cập nhật `docs/api-catalog.json`, `docs/API-CATALOG.md` và `docs/api/`. Swagger UI của gateway không phải JSON OpenAPI; dùng URL/file JSON do service hoặc deployment cung cấp.
