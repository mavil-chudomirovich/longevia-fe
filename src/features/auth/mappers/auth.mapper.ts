import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { AuthTokenDto, ProfileDto, RegisterRequestDto, UserDto } from '../types/auth.dto';
import type { AuthSession, ProfileModel, UserModel } from '../types/auth.model';
import { UserStatus } from '../types/auth.model';
import type { RegisterFormValues } from '../schemas/auth.schema';

export class AuthMapper extends BaseMapper<UserDto, UserModel> {
  toModel(dto: UserDto | null | undefined): UserModel {
    const profileDto = pickField<ProfileDto | null>(dto, ['profile'], null);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      email: safeString(pickField(dto, ['email'], '')),
      fullName: safeString(pickField(dto, ['fullName'], 'Người dùng')),
      status: safeEnum(
        pickField(dto, ['status'], UserStatus.PENDING_VERIFICATION),
        UserStatus,
        UserStatus.PENDING_VERIFICATION
      ),
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
      profile: this.toProfileModel(profileDto),
      hasProfile: Boolean(profileDto),
    };
  }

  toProfileModel(dto: ProfileDto | null | undefined): ProfileModel | null {
    if (!dto) return null;
    return {
      id: safeString(pickField(dto, ['id'], '')),
      birthDate: safeString(pickField(dto, ['birthDate'], '')),
      biologicalSex: safeString(pickField(dto, ['biologicalSex'], '')),
      heightCm: safeNumber(pickField(dto, ['heightCm'], 0)),
      activityLevel: safeString(pickField(dto, ['activityLevel'], '')),
      dietaryPreference: safeString(pickField(dto, ['dietaryPreference'], '')),
      allergies: safeArray<string>(pickField(dto, ['allergies'], [])),
      healthLimitations: safeArray<string>(pickField(dto, ['healthLimitations'], [])),
      updatedAt: safeDate(pickField(dto, ['updatedAt'], null)),
    };
  }

  toSessionModel(dto: AuthTokenDto | null | undefined): AuthSession {
    const expiresIn = safeNumber(pickField(dto, ['expiresIn'], 900), 900);
    return {
      accessToken: safeString(pickField(dto, ['accessToken'], '')),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  toRegisterDto(values: RegisterFormValues): RegisterRequestDto {
    return {
      email: values.email.trim(),
      password: values.password,
      fullName: values.fullName.trim(),
    };
  }
}

export const authMapper = new AuthMapper();
