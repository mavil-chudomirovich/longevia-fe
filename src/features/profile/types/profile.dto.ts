import type { ProfileDto, UserDto } from '@/features/auth/types/auth.dto';

export interface UpdateProfileDto {
  birthDate: string;
  biologicalSex: string;
  heightCm: number;
  activityLevel: string;
  dietaryPreference: string;
  goal: string;
  allergies: string[];
  healthLimitations: string[];
}

export type ProfileResponseDto = ProfileDto;
export type ProfileUserDto = UserDto;
