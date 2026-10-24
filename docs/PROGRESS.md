# PROGRESS — Tiến độ triển khai Longevia Frontend

> File duy nhất theo dõi tiến độ hoàn thành tính năng theo trọng số. Cập nhật sau mỗi task.

## Cách tính % hoàn thành tính năng

Mỗi feature MVP = 100%, chia theo 7 bước scaffold (`docs/ARCHITECTURE.md`):

| Bước | Trọng số | Mô tả |
| --- | --- | --- |
| 1. UI route + components | 30% | Giao diện, responsive, loading/error/empty states, tiếng Việt, shadcn |
| 2. DTO + Model interfaces | 10% | Định nghĩa contract DTO thô & UI Model sạch |
| 3. Mapper + Unit tests | 20% | `pickField` + `safe*`, kế thừa BaseMapper, kiểm thử |
| 4. API layer | 15% | Khai báo `api-endpoints` + `api/*.api.ts`, gọi axios, map dữ liệu |
| 5. TanStack Queries | 10% | Query Key Factory, query/mutation hooks, cache invalidation |
| 6. Form/Schema & Validation | 5% | React Hook Form, Zod schema, validation messages tiếng Việt |
| 7. Verification Gates | 10% | `tsc --noEmit`, `npm test`, `npm run build` |

---

## Bảng tổng hợp tiến độ

| # | Feature / Module | Trạng thái | % Hoàn thành | Ghi chú |
|---|---|---|---|---|
| **01** | **Core Foundation & Project Setup** | Hoàn thành | 100% | Next.js 16, React 19, Tailwind v4, shadcn/ui, Axios, TanStack Query, Vitest, Husky |
| **02** | **App Shell & Theme Provider** | Hoàn thành | 100% | Root layout, font Be Vietnam Pro, ThemeController, SiteHeader, SiteFooter |
| **03** | **Authentication & Session Management** | Hoàn thành | 100% | DTO, Model, Mapper, Test, API, Queries, HttpOnly Cookie Proxy, Middleware |
| **04** | **Landing Page (Trang chủ)** | Hoàn thành | 100% | Hero, 4 Trụ cột trường thọ, Tính năng nổi bật, Responsive, Dark/Light mode |
| **05** | **Diet & Nutrition Feature** | Chuẩn bị | 0% | Quản lý chế độ ăn, nhóm thực phẩm, chỉ số dinh dưỡng |
| **06** | **Meal Plans & Planning** | Chuẩn bị | 0% | Kế hoạch bữa ăn, thực đơn cá nhân hóa, gợi ý món |
| **07** | **Progress & Biomarkers** | Chuẩn bị | 0% | Nhật ký chỉ số sức khỏe, cân nặng, giấc ngủ, tuổi sinh học |
| **08** | **Longevity Assistant (AI Chat / RAG)** | Chuẩn bị | 0% | Trợ lý tư vấn dinh dưỡng trường thọ tích hợp RAG |
