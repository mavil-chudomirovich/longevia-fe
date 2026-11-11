import { UserStatus } from '@/common/enums';
export { UserStatus } from '@/common/enums';

export interface ProfileModel {
  id: string;
  birthDate: string;
  biologicalSex: string;
  heightCm: number;
  activityLevel: string;
  dietaryPreference: string;
  goal: string;
  allergies: string[];
  healthLimitations: string[];
  updatedAt: Date | null;
}

export interface UserModel {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
  createdAt: Date | null;
  profile: ProfileModel | null;
  hasProfile: boolean;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: Date;
}
