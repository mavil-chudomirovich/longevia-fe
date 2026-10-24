# WORK-LOG — Nhật ký công việc Longevia Frontend

> Ghi nhận chi tiết các thay đổi, quyết định kỹ thuật và kết quả xác minh sau mỗi task.

---

## [2026-10-25] Khởi tạo nền tảng Longevia Frontend theo kiến trúc tham khảo chuẩn

- **Mục tiêu**:
  - Thiết lập dự án frontend `longevia-fe` dựa trên kiến trúc chuẩn từ repository tham khảo (Next.js 16, React 19, Tailwind CSS v4, TypeScript strict, shadcn/ui, TanStack Query v5, Zustand, Axios, Vitest).
  - Áp dụng triệt để kiến trúc 7 tầng (DTO -> Mapper -> Model -> API -> Query -> Component -> Store).
  - Cấu hình toàn diện hệ thống routing, HttpOnly auth cookie proxy, Edge Middleware, Theme Controller, Toast notification và Brand Identity cho Longevia (Chế độ ăn trường thọ).
  - Đồng bộ các skills chuyên sâu vào `.agents/skills/` (bỏ qua SpecKit/specify theo yêu cầu của dự án).

- **Đã thực hiện**:
  1. **Cấu hình & Công cụ**:
     - `package.json`, `.npmrc`, `tsconfig.json`, `components.json`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `.prettierrc`, `.prettierignore`, `.gitignore`.
     - Git hooks với `.husky/pre-commit` kích hoạt `lint-staged`.
     - Cấu hình `next.config.ts` với image domains và rewrites định tuyến API Gateway Nginx (`http://localhost:8080/api`).
     - Script `scripts/sync-swagger.mjs` phân tách swagger JSON thành catalog tài liệu gọn nhẹ cho Agent.
  2. **Core Library & Tiện ích (`src/lib/`)**:
     - `mapper/base-mapper.ts`: Triển khai `BaseMapper` & `BaseBidirectionalMapper` cùng `field-helpers.ts` (`pickField`, `safeString`, `safeNumber`, `safeBoolean`, `safeDate`, `safeArray`, `safeEnum`).
     - `axios.ts`: Cấu hình client instance, bearer token từ memory, hàng đợi refresh token tự động, thông báo toast lỗi tiếng Việt.
     - `auth-token.ts` & `auth-refresh.ts`: Quản lý session memory, silent refresh chống race condition (Web Locks API).
     - `server-fetch.ts`: Fetch chuyên biệt cho Server Components / Actions mang theo HttpOnly cookie.
     - `env.ts`: Validate biến môi trường bằng Zod.
     - `api-error.ts`: Xử lý và trích xuất lỗi chuẩn từ API envelope.
  3. **Components & Layout**:
     - `src/components/ui/`: Bộ linh kiện shadcn/ui (Button, Card, Input, Badge, Dialog, DropdownMenu, Avatar, Sonner, Tooltip, v.v.).
     - `src/components/layout/`: `BrandLogo`, `SiteHeader`, `SiteFooter`, `ThemeToggle` hỗ trợ View Transitions API mượt mà.
     - `src/components/providers/`: `QueryProvider`, `ThemeController`, `AuthProvider`.
  4. **Authentication (`src/features/auth/`)**:
     - Module Auth mẫu chuẩn: DTO, Model, Mapper, Unit Test, API, Queries, Schemas.
     - Next.js Route Handlers proxy: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh-token`, `/api/auth/logout`.
     - `src/middleware.ts`: Edge middleware bảo vệ các route `/dashboard`, `/profile`, `/admin`.
  5. **Giao diện & Trang chủ**:
     - `src/app/globals.css`: Palette màu nhận diện Longevia (xanh thảo mộc, ngọc bích, dark/light mode).
     - `src/app/page.tsx`: Landing page giới thiệu 4 trụ cột dinh dưỡng trường thọ, tính năng thông minh và CTA.
  6. **Tài liệu dự án**:
     - `AGENTS.md`: Hướng dẫn nguyên tắc làm việc bắt buộc cho AI Agent.
     - `docs/ARCHITECTURE.md`: Tài liệu kiến trúc 7 tầng & verification gates.
     - `docs/BACKEND_INTEGRATION.md`: Bản đồ tích hợp các microservices của `longevia-be`.
     - `README.md`: Hướng dẫn cài đặt và khởi chạy.

- **Kết quả xác minh (Verification)**:
  - Dự án được cấu trúc chuẩn hóa, sạch sẽ, không có lỗi import hay thiếu thư viện.
