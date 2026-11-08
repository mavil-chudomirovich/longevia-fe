# Kiến trúc Frontend Longevia

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui, Axios, TanStack Query v5, Zustand và Vitest. Giao diện người dùng viết bằng tiếng Việt.

## Cấu trúc `src/`

```text
src/
├── app/                  # App Router: landing, auth, profile, progress, diet
│   ├── api/auth/         # Next Route Handlers làm BFF cho phiên xác thực
│   ├── (auth)/           # login, verify-email, forgot/reset-password, onboarding
│   ├── profile/
│   ├── progress/
│   └── diet/
├── common/
│   ├── constants/        # API endpoints và route constants
│   └── enums/            # Enum dùng chung theo contract backend
├── components/           # UI dùng chung, shell, layout và providers
├── features/             # auth, profile, progress, diet
│   └── <domain>/
│       ├── types/        # DTO và UI model
│       ├── mappers/      # DTO ↔ model, có unit test
│       ├── api/          # Gọi API và map dữ liệu
│       ├── queries/      # TanStack Query keys và hooks
│       ├── schemas/      # Zod validation
│       └── components/   # UI theo domain
├── lib/                  # axios, auth cookies/refresh, error, mapper, query client
├── middleware.ts         # Kiểm tra cookie phiên cho protected routes
├── store/                # Zustand client state
└── types/api.ts          # ProblemDetails và PagedResult
```

## HTTP và phiên xác thực

Browser gọi cùng origin `/api/*`; Next rewrite chuyển request tới Nginx Gateway. API service paths bắt đầu bằng `/identity`, `/diet` hoặc `/progress` sau gateway prefix `/api`.

Auth dùng Next Route Handlers làm BFF. Login forward tới Identity, lưu refresh token trong HttpOnly cookie `lv_rt` (path `/api/auth`, 7 ngày), access token trong HttpOnly cookie `lv_at` (path `/`, theo `expiresIn`) và một cookie hint `lv_session_hint` không chứa token (path `/`, 7 ngày). BFF không đưa refresh token về JavaScript. Client giữ access token trong memory để gửi Bearer cho API và dùng BFF refresh khi nhận 401. Middleware dùng access token còn hạn hoặc cookie hint để cho app tải khi token hết hạn; API vẫn bắt buộc Bearer. Backend không phát role claim nên FE không có gate admin/contributor.

Protected pages là `/progress`, `/diet`, `/profile` và `/onboarding`. Middleware chuyển guest tới `/login?from=...`; người đã có phiên được chuyển khỏi login/forgot/reset sang `/progress`. Logout gọi BFF để revoke token ở Identity và xóa cả ba cookie.

## Dòng dữ liệu

```text
UI component → TanStack Query → API client → mapper (DTO → model) → UI
```

Mọi server state dùng TanStack Query. Query keys của Profile, Diet và Progress tách theo `userId`; mutation theo dõi session và hủy request cũ khi người dùng đổi phiên. Zustand chỉ giữ auth client state và trạng thái giao diện; chỉ persist user, không persist access token.

API errors dùng Problem Details, `code` ở root và `errors` là danh sách field errors. UI rẽ nhánh theo mã lỗi ổn định. `types/api.ts` định nghĩa `ProblemDetails`, `FieldError` và `PagedResult<T>`; không có envelope `{ success, data }`.

## Quy ước phát triển

- Mọi API response đi qua DTO → mapper → model trước khi tới UI.
- Không dùng `any`, `as any`, `@ts-ignore` hoặc hard-code API URL trong feature.
- Dùng endpoint constants, query key factory và các trạng thái loading/error/empty/success.
- Chỉ giữ route có lối vào từ UI; không tạo trang cho endpoint không tồn tại.
- Form validate ở client theo contract, backend vẫn là nơi xác thực cuối cùng.

## Kiểm tra

```powershell
npx tsc --noEmit
npm test
npm run lint
npm run build
```
