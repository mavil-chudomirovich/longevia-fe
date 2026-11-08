import { describe, expect, it } from 'vitest';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import { registerSchema } from '@/features/auth/schemas/auth.schema';
import { UserStatus } from '@/features/auth/types/auth.model';

describe('Identity mapper', () => {
  it('maps the real user response, including a nullable profile', () => {
    const user = authMapper.toModel({
      id: 'user-1',
      email: 'a@example.com',
      fullName: 'Nguyễn Văn A',
      status: 'Active',
      createdAt: '2026-11-01T10:00:00Z',
      profile: {
        id: 'profile-1',
        birthDate: '1990-01-02',
        biologicalSex: 'Female',
        heightCm: 165.5,
        activityLevel: 'LightlyActive',
        dietaryPreference: 'Vegan',
        allergies: ['Đậu nành'],
        updatedAt: '2026-11-01T10:00:00Z',
      },
    });
    expect(user).toMatchObject({
      id: 'user-1',
      fullName: 'Nguyễn Văn A',
      status: UserStatus.ACTIVE,
      hasProfile: true,
      profile: { heightCm: 165.5, allergies: ['Đậu nành'] },
    });
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.profile?.updatedAt).toBeInstanceOf(Date);
  });

  it('keeps a missing profile null and defaults unknown status safely', () => {
    expect(authMapper.toModel({ id: 'user-2', status: 'Unknown', profile: null })).toMatchObject({
      status: UserStatus.PENDING_VERIFICATION,
      hasProfile: false,
      profile: null,
    });
  });

  it('maps token expiry from expiresIn', () => {
    const before = Date.now();
    const session = authMapper.toSessionModel({ accessToken: 'token', expiresIn: 900 });
    expect(session.accessToken).toBe('token');
    expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 899_000);
  });
});

describe('Registration contract', () => {
  const base = {
    fullName: 'Nguyễn Văn A',
    email: 'a@example.com',
    password: 'Abcd1234!',
    confirmPassword: 'Abcd1234!',
  };
  it('requires lower, upper, digit, special character and matching confirmation', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(
      registerSchema.safeParse({ ...base, password: 'Abcd1234', confirmPassword: 'Abcd1234' })
        .success
    ).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: 'different' }).success).toBe(false);
  });
});
