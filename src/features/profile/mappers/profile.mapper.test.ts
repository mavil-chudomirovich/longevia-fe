import { describe, expect, it } from 'vitest';
import { profileMapper } from '@/features/profile/mappers/profile.mapper';
import { profileSchema } from '@/features/profile/schemas/profile.schema';

describe('ProfileMapper', () => {
  it('maps the Identity profile and keeps nullable update time', () => {
    const profile = profileMapper.toModel({
      id: 'profile-1',
      birthDate: '1990-01-02',
      biologicalSex: 'Female',
      heightCm: 165.5,
      activityLevel: 'LightlyActive',
      dietaryPreference: 'Vegan',
      allergies: ['Soy'],
      healthLimitations: ['joint_pain'],
      updatedAt: '2026-11-01T10:00:00Z',
    });

    expect(profile).toMatchObject({
      id: 'profile-1',
      heightCm: 165.5,
      allergies: ['Soy'],
      healthLimitations: ['joint_pain'],
    });
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('maps validated form values to the Identity update contract', () => {
    const payload = profileMapper.toUpdateDto(
      profileSchema.parse({
        birthDate: '1990-01-02',
        biologicalSex: 'Female',
        heightCm: '165.5',
        activityLevel: 'LightlyActive',
        dietaryPreference: 'Vegan',
        goal: 'Longevity',
        allergies: [' Soy '],
        healthLimitations: ['joint_pain'],
      })
    );

    expect(payload).toEqual({
      birthDate: '1990-01-02',
      biologicalSex: 'Female',
      heightCm: 165.5,
      activityLevel: 'LightlyActive',
      dietaryPreference: 'Vegan',
      goal: 'Longevity',
      allergies: ['Soy'],
      healthLimitations: ['joint_pain'],
    });
  });
});
