import { BaseMapper, pickField, safeBoolean, safeDate, safeEnum, safeString } from '@/lib/mapper';
import {
  AuthSessionResponseDto,
  ContributorApplicationDto,
  LogoutResponseDto,
  ProfileResponseDto,
  RefreshResponseDto,
  RegisterRequestDto,
  UserDto,
} from '../types/auth.dto';
import {
  AuthSession,
  ContributorApplication,
  LogoutResult,
  RefreshedToken,
  User,
} from '../types/auth.model';
import type { RegisterFormValues } from '../schemas/auth.schema';
import {
  ContributorApplicationStatus,
  ContributorApprovalBasis,
  LogoutScope,
  MemberStatus,
  UserRole,
} from '@/common/enums';

const APPROVAL_BASIS_LABELS: Record<ContributorApprovalBasis, string> = {
  [ContributorApprovalBasis.ORGANIZATION_AFFILIATION]: 'Tổ chức đối tác / Viện ẩm thực',
  [ContributorApprovalBasis.PLATFORM_TRACK_RECORD]: 'Thành viên uy tín trên nền tảng',
  [ContributorApprovalBasis.ADMIN_INVITED]: 'Được Quản trị viên mời',
};

/**
 * AuthMapper chuyển DTO backend (OpenAPI `AuthSessionResponse` / `ProfileResponse`)
 * sang Domain Model sạch cho UI. Mọi field đều qua `pickField` + `safe*`.
 */
export class AuthMapper extends BaseMapper<UserDto, User> {
  toModel(dto: UserDto | null | undefined): User {
    const displayName = safeString(pickField(dto, ['displayName', 'display_name'], 'Người dùng'));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      email: safeString(pickField(dto, ['email'], '')),
      displayName,
      avatarUrl: safeString(pickField(dto, ['avatarUrl', 'avatar_url'], '')),
      role: safeEnum(pickField(dto, ['role'], 'MEMBER'), UserRole, UserRole.MEMBER),
      status: safeEnum(pickField(dto, ['status'], 'ACTIVE'), MemberStatus, MemberStatus.ACTIVE),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      contributorApplication: this.toContributorApplication(
        pickField<ContributorApplicationDto | null>(
          dto,
          ['contributorApplication', 'contributor_application'],
          null
        )
      ),
      initials: toInitials(displayName),
    };
  }

  /** Đơn nguyện vọng — chỉ để hiển thị, không bao giờ dùng để cấp quyền (FR-008). */
  toContributorApplication(
    dto: ContributorApplicationDto | null | undefined
  ): ContributorApplication | null {
    if (!dto || typeof dto !== 'object') return null;
    const rawStatus = safeString(pickField(dto, ['status'], 'PENDING'));
    const rawBasis = pickField(dto, ['claimedApprovalBasis', 'claimed_approval_basis'], null);
    const claimedApprovalBasis = safeEnum(
      rawBasis,
      ContributorApprovalBasis,
      null as unknown as ContributorApprovalBasis
    );

    return {
      status: safeEnum(
        rawStatus,
        ContributorApplicationStatus,
        ContributorApplicationStatus.PENDING
      ),
      rawStatus,
      claimedApprovalBasis: claimedApprovalBasis ?? null,
      claimedApprovalBasisLabel:
        claimedApprovalBasis && claimedApprovalBasis in APPROVAL_BASIS_LABELS
          ? APPROVAL_BASIS_LABELS[claimedApprovalBasis as ContributorApprovalBasis]
          : '',
    };
  }

  /** `POST /auth/register` và `POST /auth/login` → `AuthSession`. */
  toSessionModel(dto: AuthSessionResponseDto | null | undefined): AuthSession {
    const data = pickField(dto, ['data'], null) as AuthSessionResponseDto['data'];
    const rawUser = pickField<UserDto | null | undefined>(data, ['user'], null);
    return {
      accessToken: safeString(pickField(data, ['accessToken', 'access_token'], '')),
      accessTokenExpiresAt: safeDate(
        pickField(data, ['accessTokenExpiresAt', 'access_token_expires_at'], null)
      ),
      user: this.toModel(rawUser),
    };
  }

  /** `POST /auth/refresh` → `RefreshedToken`. */
  toRefreshedTokenModel(dto: RefreshResponseDto | null | undefined): RefreshedToken {
    const data = pickField(dto, ['data'], null) as RefreshResponseDto['data'];
    return {
      accessToken: safeString(pickField(data, ['accessToken', 'access_token'], '')),
      accessTokenExpiresAt: safeDate(
        pickField(data, ['accessTokenExpiresAt', 'access_token_expires_at'], null)
      ),
    };
  }

  /** `POST /auth/logout` → `LogoutResult`. */
  toLogoutResultModel(dto: LogoutResponseDto | null | undefined): LogoutResult {
    const data = pickField(dto, ['data'], null) as LogoutResponseDto['data'];
    const loggedOut = safeBoolean(pickField(data, ['loggedOut'], true));
    const scope = safeEnum(
      pickField(data, ['scope'], LogoutScope.CURRENT),
      LogoutScope,
      LogoutScope.CURRENT
    );
    return { loggedOut, scope };
  }

  /** `GET /users/me` → `User`. Phần health/diet của `data` thuộc feature khác, bỏ qua. */
  toProfileModel(dto: ProfileResponseDto | null | undefined): User {
    const data = pickField(dto, ['data'], null) as UserDto | null;
    return this.toModel(data);
  }

  /**
   * Map `RegisterFormValues` sang payload backend yêu cầu.
   * Chỉ gửi `contributorRequest` khi user bật nguyện vọng.
   */
  toRegisterDto(values: RegisterFormValues): RegisterRequestDto {
    const payload: RegisterRequestDto = {
      email: safeString(values.email),
      password: safeString(values.password, ''),
      displayName: safeString(values.displayName),
    };
    if (values.wantsContributor) {
      payload.contributorRequest = {
        claimedApprovalBasis: values.claimedApprovalBasis ?? 'PLATFORM_TRACK_RECORD',
        ...(values.claimedApprovalBasis === 'ORGANIZATION_AFFILIATION'
          ? { organizationClaim: safeString(values.organizationClaim).trim() }
          : {}),
        experience: safeString(values.experience),
        referenceLinks:
          values.referenceLinks
            ?.split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0) ?? [],
      };
    }
    return payload;
  }
}

function toInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const authMapper = new AuthMapper();
