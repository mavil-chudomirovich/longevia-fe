import { BaseMapper, safeArray, safeNumber, safeString } from '@/lib/mapper';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { ProfileDto } from '@/features/auth/types/auth.dto';
import type { ProfileModel } from '@/features/auth/types/auth.model';
import type { ProfileFormValues } from '../schemas/profile.schema';
import type { UpdateProfileDto } from '../types/profile.dto';

export class ProfileMapper extends BaseMapper<ProfileDto, ProfileModel> {
  toModel(dto: ProfileDto | null | undefined): ProfileModel {
    const mapped = authMapper.toProfileModel(dto);
    return (
      mapped ?? {
        id: '',
        birthDate: '',
        biologicalSex: '',
        heightCm: 0,
        activityLevel: '',
        dietaryPreference: '',
        goal: 'Maintain',
        allergies: [],
        healthLimitations: [],
        updatedAt: null,
      }
    );
  }

  toUpdateDto(values: ProfileFormValues): UpdateProfileDto {
    return {
      birthDate: values.birthDate,
      biologicalSex: values.biologicalSex,
      heightCm: safeNumber(values.heightCm),
      activityLevel: values.activityLevel,
      dietaryPreference: values.dietaryPreference,
      goal: values.goal,
      allergies: safeArray<string>(values.allergies)
        .map((item) => safeString(item).trim())
        .filter(Boolean),
      healthLimitations: safeArray<string>(values.healthLimitations)
        .map((item) => safeString(item).trim())
        .filter(Boolean),
    };
  }
}

export const profileMapper = new ProfileMapper();
