# AGENTS.md — Chỉ dẫn bắt buộc cho AI Agent làm việc tại Longevia Frontend

> Bạn là coding agent làm việc trong workspace **`longevia-fe`** thuộc dự án **Longevia** (Nền tảng dinh dưỡng & Chế độ ăn trường thọ).
> **ĐỌC KỸ FILE NÀY TRƯỚC TIÊN**. Phải tuân thủ nghiêm ngặt các quy tắc kiến trúc, quy trình nhận task và quy định sử dụng Skills dưới đây trước khi viết bất kỳ dòng code nào.

---

## 1. Thứ tự đọc tài liệu bắt buộc (trước khi nhận task)

| # | Tài liệu | Nội dung trọng tâm cần nắm |
|---|---|---|
| **1** | `docs/ARCHITECTURE.md` | **Quan trọng nhất cho code frontend.** Quy tắc scaffold 7 tầng, DTO -> Mapper -> Model, rule cấm trang mồ côi, tiếng Việt. |
| **2** | `docs/BACKEND_INTEGRATION.md` | Bản đồ API các microservices backend (Identity, Diet, Progress, Recommendation). Chỉ tích hợp endpoint `READY`. |
| **3** | `docs/PROGRESS.md` & `docs/WORK-LOG.md` | Nơi theo dõi tiến độ % và nhật ký công việc. Agent **bắt buộc cập nhật sau mỗi task**. |
| **4** | `package.json`, `components.json`, `tsconfig.json` | Tech stack (Next.js 16, React 19, Tailwind v4, shadcn/ui style `new-york`), path alias `@/*`. |
| **5** | `src/app/layout.tsx`, `src/middleware.ts`, `src/lib/auth-refresh.ts` | App shell, cơ chế Auth session, HttpOnly cookie, silent-refresh chống race condition. |
| **6** | `src/features/auth/*` | **Feature mẫu chuẩn end-to-end**: DTO -> Model -> Mapper -> API -> Query -> Components. Mọi feature mới phải theo đúng mẫu này. |

---

## 2. Quy tắc BẮT BUỘC sử dụng Skills (`.agents/skills/`)

Hệ sinh thái dự án trang bị sẵn các bộ kỹ năng chuyên sâu tại `.agents/skills/`. **Khi gặp ngữ cảnh công việc tương ứng, Agent BẮT BUỘC phải mở file `SKILL.md` của skill đó ra đọc và tuân thủ các nguyên tắc thiết kế/kỹ thuật:**

### 🎨 2.1. Xây dựng UI / Component / Layout / Styling
- **`shadcn`** (`.agents/skills/shadcn/SKILL.md`):
  - Bắt buộc tham chiếu khi thêm, cấu hình hoặc sửa các component UI cơ bản (`components/ui/*`). Không tự viết lại component nếu shadcn đã hỗ trợ.
- **`ui-ux-pro-max`** (`.agents/skills/ui-ux-pro-max/SKILL.md`):
  - Tham chiếu khi thiết kế màn hình, căn chỉnh typography, phân cấp thị giác (visual hierarchy), responsive layout, form validation states.
- **`baseline-ui`** (`.agents/skills/baseline-ui/SKILL.md`):
  - Kiểm tra thang đo typography, độ tương phản accessibility, timing animation chuẩn (150ms–300ms), ngăn chặn layout anti-patterns.
- **`design-taste-frontend`** & **`impeccable`**:
  - Triệt tiêu giao diện AI khuôn mẫu (anti-slop), đảm bảo giao diện cao cấp, màu sắc hài hòa với định vị thương hiệu sống khỏe Longevia.

### ⚡ 2.2. Hoạt cảnh & Hiệu năng chuyển động
- **`fixing-motion-performance`** (`.agents/skills/fixing-motion-performance/SKILL.md`):
  - Mọi animation bắt buộc phải mượt mà 60 FPS trên cả desktop và mobile.
  - **100% GPU Compositor properties:** Chỉ animate qua `transform` (`translate3d`, `rotate`, `scale`) và `opacity`. Tuyệt đối CẤM animate các thuộc tính gây layout thrashing (`top`, `left`, `width`, `height`, `margin`, `padding`).

### 🌐 2.3. Kiến trúc Next.js App Router & Server Components
- **`next-best-practices`** (`.agents/skills/next-best-practices/SKILL.md`):
  - Phân tách rõ ràng ranh giới Server Components (RSC) và Client Components (`'use client'`).
  - Tối ưu hóa route handlers, HttpOnly cookies, metadata SEO động.

### 🛡️ 2.4. Trọn vẹn chất lượng Code (Anti-Truncation)
- **`full-output-enforcement`** (`.agents/skills/full-output-enforcement/SKILL.md`):
  - **Nghiêm cấm** viết code cắt xén, placeholder giả dạng `// ... existing code ...` hoặc bỏ lửng hàm. Mọi file được tạo hoặc chỉnh sửa phải hoàn chỉnh 100% logic.

---

## 3. Quy chuẩn kiến trúc cốt lõi

1. **Bộ ba DTO - Model - Mapper**:
   - Mọi dữ liệu từ API phải qua DTO -> Mapper (`pickField`, `safe*`, kế thừa `BaseMapper`) -> Model.
   - UI Component chỉ được phép đọc và hiển thị **UI Model**, tuyệt đối không đọc trực tiếp DTO.
2. **Nghiêm cấm tuyệt đối**:
   - `any`, `as any`, `@ts-ignore`, `Record<string, any>`.
   - Hard-code URL API trong feature (phải khai báo tập trung trong `src/common/constants/api-endpoints.ts`).
   - Import tương đối sâu `../../..` (bắt buộc dùng alias `@/*`).
   - Lưu trữ server-state vào Zustand (Zustand chỉ dành cho client-state: auth session memory, theme, sidebar).
3. **Quản lý dữ liệu**:
   - Dùng **TanStack Query** cho toàn bộ server-state; bắt buộc tạo Query Key Factory và xử lý triệt để 4 trạng thái: Loading, Error, Empty, Success.
4. **Quy tắc cấm trang mồ côi (No Orphan Pages)**:
   - Bất kỳ trang nào tồn tại phải có ít nhất một lối vào tự nhiên từ UI (Header/Footer/Context link).
5. **Ngôn ngữ UI**: Toàn bộ nhãn, thông báo, nút bấm hiển thị cho người dùng phải dùng **tiếng Việt**.

---

## 4. Quy trình nhận và bàn giao task chuẩn

1. **Phân tích yêu cầu**: Đối chiếu tài liệu, kiểm tra trạng thái API trong `docs/BACKEND_INTEGRATION.md`. Mở skill tương ứng để đối chiếu tiêu chuẩn.
2. **Lập kế hoạch**: Trình bày rõ các file sẽ tạo/sửa theo 7 bước scaffold nếu là feature mới.
3. **Triển khai**: Viết code sạch, kèm mapper unit test.
4. **Xác minh chất lượng bắt buộc (Verification Gates)**:
   - `npx tsc --noEmit` (0 lỗi type).
   - `npm test` (toàn bộ test suite pass).
   - `npm run build` (build Next.js thành công).
5. **Cập nhật tài liệu tiến độ**:
   - Cập nhật mục tương ứng trong `docs/PROGRESS.md`.
   - Viết nhật ký công việc vào `docs/WORK-LOG.md` theo đúng mẫu chuẩn.
