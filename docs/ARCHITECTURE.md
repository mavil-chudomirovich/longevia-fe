# ARCHITECTURE & CODING RULES — Longevia Frontend (`longevia-fe`)

> **Đối tượng**: Nhà phát triển và AI coding agents. Đọc kỹ tài liệu này trước khi viết code.
> **Tech Stack**: Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui + Axios + TanStack Query v5 + Zustand + Mapper Pattern.
> **Ngôn ngữ UI mặc định**: **Tiếng Việt**.

---

## 1. Cây thư mục `src/` và trách nhiệm

```
src/
├── app/                  # Routes, Layouts, Server Components mặc định. Ghép providers & pages.
│   ├── layout.tsx        # QueryProvider > ThemeController > AuthProvider > TooltipProvider + Toaster
│   ├── page.tsx          # Landing page Longevia
│   ├── error.tsx         # Global Error Boundary
│   ├── not-found.tsx     # 404 handler
│   ├── (auth)/           # Route group cho Authentication (login, register)
│   └── api/auth/*/route.ts # Route Handlers proxy BE (forward HttpOnly cookies)
├── middleware.ts         # Edge middleware: kiểm tra JWT cookie, phân quyền admin/member
├── common/
│   ├── constants/api-endpoints.ts  # Tập trung mọi endpoint API. CẤM hardcode string URL trong feature.
│   └── enums/            # Enum dùng chung toàn hệ thống.
├── components/
│   ├── ui/               # shadcn/ui components (new-york style, radix-ui, tailwind v4).
│   ├── layout/           # BrandLogo, SiteHeader, SiteFooter, ThemeToggle.
│   └── providers/        # query-provider, auth-provider, theme-controller.
├── features/<domain>/    # Đơn vị nghiệp vụ chính (auth, diet, meal-plan, progress, assistant).
│   ├── types/*.dto.ts    # Dữ liệu THÔ từ Backend (permissive, union, nullable).
│   ├── types/*.model.ts  # Dữ liệu SẠCH cho UI (camelCase, non-null, strictly typed).
│   ├── mappers/*.mapper.ts # DTO -> Model (và ngược lại cho Create/Update).
│   ├── mappers/*.test.ts # Unit test kiểm chứng mapper.
│   ├── api/*.api.ts      # Gọi axios/serverFetch + map qua mapper. KHÔNG leak DTO ra ngoài.
│   ├── queries/*.queries.ts # TanStack Query hooks + Query Key Factory.
│   ├── schemas/          # Zod schema cho forms (react-hook-form).
│   └── components/       # UI Components chỉ nhận Model, KHÔNG nhận DTO.
├── lib/
│   ├── axios.ts          # Axios client: Bearer từ memory, refresh queue, auto toast error.
│   ├── auth-token.ts     # In-memory single source of truth cho accessToken.
│   ├── auth-refresh.ts   # Silent refresh, cross-tab locking (Web Locks), forceLogout.
│   ├── server-fetch.ts   # Server-side fetch (RSC, Server Actions) chuyển tiếp HttpOnly cookie.
│   ├── query-client.ts   # TanStack Query Client cấu hình (staleTime 1m, gcTime 5m).
│   ├── api-error.ts      # Trích xuất lỗi chuẩn hóa, type guards, toastApiError.
│   ├── utils.ts          # cn(), formatCurrency(), formatDate().
│   └── mapper/           # Core: BaseMapper, BaseBidirectionalMapper, field-helpers.
├── store/                # Zustand Client-State ONLY: useAuthStore, useUIStore.
├── hooks/                # Custom React hooks dùng chung (useDebounce, useMediaQuery).
└── types/api.ts          # Standard API Envelopes: APIResponse<T>, ErrorResponse, PaginationResult<T>.
```

---

## 2. Luồng dữ liệu chuẩn (7-Layer Scaffold)

### Client Components:
```
UI Component 
  └──> queries/*.queries.ts (TanStack Query)
         └──> api/*.api.ts (axios instance)
                └──> mappers/*.mapper.ts (pickField, safe* helpers)
                       └──> UI Model
                              └──> Render UI
```

### Server Components (RSC):
```
Server Component 
  └──> lib/server-fetch.ts (+ mapper)
         └──> UI Model 
                └──> Render HTML
```

---

## 3. Quy tắc cốt lõi (BẮT BUỘC)

1. **Bộ ba DTO - Model - Mapper**:
   - Mọi dữ liệu từ API phải qua `DTO` -> `Mapper` -> `Model`.
   - UI Component **chỉ được phép đọc UI Model**, tuyệt đối không đọc trực tiếp DTO.
   - Khi tạo hoặc cập nhật `api/*.api.ts`, bắt buộc phải tạo/cập nhật `mappers/*.mapper.ts` đi kèm.

2. **Nghiêm cấm tuyệt đối**:
   - `any`, `as any`, `@ts-ignore`, `Record<string, any>`.
   - Hard-code URL API trong feature (phải khai báo trong `src/common/constants/api-endpoints.ts`).
   - Import tương đối sâu `../../..` (bắt buộc dùng path alias `@/*`).
   - Lưu trữ server-state vào Zustand (Zustand chỉ dùng cho client-state: auth session memory, theme, sidebar).

3. **Quản lý dữ liệu**:
   - Dùng **TanStack Query** cho toàn bộ server-state; bắt buộc tạo Query Key Factory và xử lý triệt để 4 trạng thái: Loading, Error, Empty, Success.

4. **Ngôn ngữ UI**:
   - Toàn bộ nhãn, thông báo, nút bấm hiển thị cho người dùng phải dùng **tiếng Việt**.

5. **Quy tắc không trang mồ côi (No Orphan Pages)**:
   - Bất kỳ trang nào tồn tại phải có ít nhất một lối vào tự nhiên từ UI (Header, Footer, Sidebar, Navigation link).

---

## 4. Verification Gates (Cổng kiểm tra chất lượng)

Trước khi bàn giao bất kỳ task nào, phải vượt qua toàn bộ 3 cổng kiểm tra:

```powershell
# 1. Typecheck (0 lỗi type)
npx tsc --noEmit

# 2. Unit test (100% test pass)
npm test

# 3. Production build
npm run build
```
