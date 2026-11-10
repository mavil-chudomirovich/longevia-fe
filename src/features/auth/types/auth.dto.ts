export interface AuthTokenDto {
  accessToken?: string;
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
}

export interface ProfileDto {
  id?: string;
  birthDate?: string;
  biologicalSex?: string;
  heightCm?: number;
  activityLevel?: string;
  dietaryPreference?: string;
  allergies?: string[] | null;
  healthLimitations?: string[] | null;
  updatedAt?: string;
}

export interface UserDto {
  id?: string;
  email?: string;
  fullName?: string;
  status?: string;
  createdAt?: string;
  profile?: ProfileDto | null;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}
