/**
 * DTO dữ liệu thô từ Backend theo OpenAPI đã sync (`docs/api/auth.md`, `docs/api/users.md`).
 * Mọi DTO đều optional/union-compatible: mapper phải dùng `pickField` + `safe*` cho mọi field.
 * Refresh token KHÔNG nằm trong body — backend chỉ đặt HttpOnly cookie.
 */

/** User thô như backend trả trong `AuthSessionResponse.data.user` / `ProfileResponse.data`. */
export interface UserDto {
  id?: string;
  email?: string;
  displayName?: string;
  display_name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  contributorApplication?: ContributorApplicationDto | null;
  contributor_application?: ContributorApplicationDto | null;
}

/** Đơn nguyện vọng contributor thô (chỉ để hiển thị, không cấp quyền). */
export interface ContributorApplicationDto {
  status?: string;
  claimedApprovalBasis?: string;
  claimed_approval_basis?: string;
}

/** `POST /auth/register` + `POST /auth/login` → `201/200 AuthSessionResponse`. */
export interface AuthSessionResponseDto {
  success?: boolean;
  data?: {
    user?: UserDto | null;
    accessToken?: string;
    access_token?: string;
    accessTokenExpiresAt?: string;
    access_token_expires_at?: string;
  } | null;
  meta?: null;
}

/** `POST /auth/refresh` → `200 RefreshResponse`. */
export interface RefreshResponseDto {
  success?: boolean;
  data?: {
    accessToken?: string;
    access_token?: string;
    accessTokenExpiresAt?: string;
    access_token_expires_at?: string;
  } | null;
  meta?: null;
}

/** `POST /auth/logout` → `200 LogoutResponse`. */
export interface LogoutResponseDto {
  success?: boolean;
  data?: {
    loggedOut?: boolean;
    scope?: string;
  } | null;
  meta?: null;
}

/** `GET /users/me` → `200 ProfileResponse`. Consumer auth chỉ map 8 field user đầu;
 * phần `healthProfile`/`dietPreference` thuộc `features/profile` (ngoài scope slice này). */
export interface ProfileResponseDto {
  success?: boolean;
  data?: (UserDto & Record<string, unknown>) | null;
  meta?: null;
}

/** Nguyện vọng contributor gửi kèm khi đăng ký (optional). */
export interface ContributorRequestDto {
  claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';
  organizationClaim?: string;
  experience: string;
  referenceLinks?: string[];
}

/** `POST /auth/register` request. */
export interface RegisterRequestDto {
  email: string;
  password: string;
  displayName: string;
  contributorRequest?: ContributorRequestDto;
}

/** `POST /auth/login` request. Schema backend chỉ có 2 field — không có CAPTCHA. */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/** `POST /auth/logout` request. Mặc định CURRENT khi không gửi. */
export interface LogoutRequestDto {
  allDevices?: boolean;
}
