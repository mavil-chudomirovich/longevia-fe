import { describe, expect, it } from 'vitest';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import { registerSchema } from '@/features/auth/schemas/auth.schema';
import {
  ContributorApplicationStatus,
  ContributorApprovalBasis,
  LogoutScope,
  MemberStatus,
  UserRole,
} from '@/common/enums';

const FULL_USER = {
  id: 'c0a8b1d2-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  email: 'user@example.com',
  displayName: 'Nguyễn Văn A',
  avatarUrl: null,
  role: 'MEMBER',
  status: 'ACTIVE',
  createdAt: '2026-09-15T08:30:00.000Z',
  contributorApplication: { status: 'PENDING', claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' },
} as const;

describe('AuthMapper.toModel', () => {
  it('map đúng shape thật của backend, avatar null và đơn PENDING', () => {
    const u = authMapper.toModel({ ...FULL_USER });

    expect(u.id).toBe(FULL_USER.id);
    expect(u.email).toBe('user@example.com');
    expect(u.displayName).toBe('Nguyễn Văn A');
    expect(u.avatarUrl).toBe('');
    expect(u.role).toBe(UserRole.MEMBER);
    expect(u.status).toBe(MemberStatus.ACTIVE);
    expect(u.createdAt).toBeInstanceOf(Date);
    expect(u.contributorApplication).toMatchObject({
      status: ContributorApplicationStatus.PENDING,
      rawStatus: 'PENDING',
      claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
    });
    expect(u.initials).toBe('NA');
  });

  it('role/status lạ thì fallback an toàn mà không crash', () => {
    const u = authMapper.toModel({
      id: 'x',
      email: 'x@y.vn',
      displayName: 'An',
      role: 'SUPERUSER',
      status: 'FROZEN',
      contributorApplication: { status: 'WEIRD', claimedApprovalBasis: 'UNKNOWN' },
    });

    expect(u.role).toBe(UserRole.MEMBER);
    expect(u.status).toBe(MemberStatus.ACTIVE);
    expect(u.contributorApplication?.status).toBe(ContributorApplicationStatus.PENDING);
    expect(u.contributorApplication?.rawStatus).toBe('WEIRD');
    expect(u.contributorApplication?.claimedApprovalBasis).toBeNull();
  });

  it('trả defaults an toàn khi dto null/thiếu trường', () => {
    const u = authMapper.toModel(null);

    expect(u.id).toBe('');
    expect(u.displayName).toBe('Người dùng');
    expect(u.avatarUrl).toBe('');
    expect(u.role).toBe(UserRole.MEMBER);
    expect(u.status).toBe(MemberStatus.ACTIVE);
    expect(u.createdAt).toBeNull();
    expect(u.contributorApplication).toBeNull();
  });
});

describe('AuthMapper.toSessionModel', () => {
  it('đọc đúng session lồng data.user, không nhầm data thành user', () => {
    const s = authMapper.toSessionModel({
      success: true,
      data: {
        user: { ...FULL_USER },
        accessToken: 'jwt-access',
        accessTokenExpiresAt: '2026-09-15T08:45:00.000Z',
      },
      meta: null,
    });

    expect(s.accessToken).toBe('jwt-access');
    expect(s.accessTokenExpiresAt).toBeInstanceOf(Date);
    expect(s.user.id).toBe(FULL_USER.id);
    expect(s.user.displayName).toBe('Nguyễn Văn A');
  });

  it('trả session rỗng an toàn khi envelope null/thiếu data', () => {
    const s = authMapper.toSessionModel(null);
    expect(s.accessToken).toBe('');
    expect(s.accessTokenExpiresAt).toBeNull();
    expect(s.user.id).toBe('');
  });
});

describe('AuthMapper.toRefreshedTokenModel', () => {
  it('map đúng RefreshResponse', () => {
    const t = authMapper.toRefreshedTokenModel({
      success: true,
      data: { accessToken: 'jwt-new', accessTokenExpiresAt: '2026-09-15T09:00:00.000Z' },
      meta: null,
    });
    expect(t.accessToken).toBe('jwt-new');
    expect(t.accessTokenExpiresAt).toBeInstanceOf(Date);
  });

  it('trả token rỗng khi dto null', () => {
    expect(authMapper.toRefreshedTokenModel(null).accessToken).toBe('');
  });
});

describe('AuthMapper.toLogoutResultModel', () => {
  it('map đúng scope ALL_DEVICES', () => {
    const r = authMapper.toLogoutResultModel({
      success: true,
      data: { loggedOut: true, scope: 'ALL_DEVICES' },
      meta: null,
    });
    expect(r.loggedOut).toBe(true);
    expect(r.scope).toBe(LogoutScope.ALL_DEVICES);
  });

  it('fallback CURRENT khi thiếu scope', () => {
    expect(authMapper.toLogoutResultModel(null).scope).toBe(LogoutScope.CURRENT);
  });
});

describe('AuthMapper.toProfileModel', () => {
  it('map đúng ProfileResponse, bỏ qua health/diet ngoài scope', () => {
    const u = authMapper.toProfileModel({
      success: true,
      data: { ...FULL_USER, healthProfile: { bmi: 21.5 }, dietPreference: null },
      meta: null,
    });
    expect(u.id).toBe(FULL_USER.id);
    expect(u.role).toBe(UserRole.MEMBER);
  });
});

describe('AuthMapper.toRegisterDto', () => {
  it('không gửi contributorRequest khi user không bật nguyện vọng', () => {
    const dto = authMapper.toRegisterDto({
      displayName: 'Nguyễn Văn A',
      email: 'user@example.com',
      password: 'Abcd1234',
      confirmPassword: 'Abcd1234',
      wantsContributor: false,
    });
    expect(dto).toEqual({
      email: 'user@example.com',
      password: 'Abcd1234',
      displayName: 'Nguyễn Văn A',
    });
  });

  it('gửi contributorRequest đã lọc link rỗng khi bật nguyện vọng', () => {
    const dto = authMapper.toRegisterDto({
      displayName: 'Nguyễn Văn A',
      email: 'user@example.com',
      password: 'Abcd1234',
      confirmPassword: 'Abcd1234',
      wantsContributor: true,
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
      organizationClaim: 'Nhóm nấu chay cộng đồng',
      experience: '5 năm nấu chay cho cộng đồng',
      referenceLinks: 'https://blog.example.com\n\n  \nhttps://video.example.com/x',
    });
    expect(dto.contributorRequest).toEqual({
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
      organizationClaim: 'Nhóm nấu chay cộng đồng',
      experience: '5 năm nấu chay cho cộng đồng',
      referenceLinks: ['https://blog.example.com', 'https://video.example.com/x'],
    });
  });

  it('không gửi organizationClaim cho căn cứ hoạt động trên nền tảng', () => {
    const dto = authMapper.toRegisterDto({
      displayName: 'Nguyễn Văn B',
      email: 'member@example.com',
      password: 'Abcd1234',
      confirmPassword: 'Abcd1234',
      wantsContributor: true,
      claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
      organizationClaim: 'Giá trị cũ trong form',
      experience: 'Tôi đã chia sẻ công thức chay trong nhiều năm.',
    });
    expect(dto.contributorRequest).toEqual({
      claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
      experience: 'Tôi đã chia sẻ công thức chay trong nhiều năm.',
      referenceLinks: [],
    });
  });
});

describe('Contributor registration validation', () => {
  const base = {
    displayName: 'Nguyễn Văn A',
    email: 'member@example.com',
    password: 'Abcd1234',
    confirmPassword: 'Abcd1234',
    wantsContributor: true,
    experience: 'Tôi đã nấu món chay cho cộng đồng trong năm năm.',
  };

  it('yêu cầu tên tổ chức khi khai báo liên kết tổ chức', () => {
    expect(
      registerSchema.safeParse({ ...base, claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' })
        .success
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...base,
        claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
        organizationClaim: 'Bếp Chay Xanh',
      }).success
    ).toBe(true);
  });

  it('giới hạn liên kết theo backend', () => {
    const result = registerSchema.safeParse({
      ...base,
      claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
      referenceLinks: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});
