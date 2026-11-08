import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { authMapper } from '../mappers/auth.mapper';
import type {
  AuthTokenDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  UserDto,
} from '../types/auth.dto';
import type { AuthSession, UserModel } from '../types/auth.model';
import type { RegisterFormValues } from '../schemas/auth.schema';

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (values: RegisterFormValues): Promise<UserModel> => {
    const payload: RegisterRequestDto = authMapper.toRegisterDto(values);
    const response = await api.post<UserDto>(API_ENDPOINTS.BFF.REGISTER, payload);
    return authMapper.toModel(response.data);
  },

  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const response = await api.post<AuthTokenDto>(API_ENDPOINTS.BFF.LOGIN, payload);
    const session = authMapper.toSessionModel(response.data);
    if (!session.accessToken) throw new Error('Máy chủ không trả access token.');
    return session;
  },

  getMe: async (): Promise<UserModel> => {
    const response = await api.get<UserDto>(API_ENDPOINTS.IDENTITY.USERS.ME);
    return authMapper.toModel(response.data);
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(API_ENDPOINTS.IDENTITY.AUTH.VERIFY, { params: { token } });
  },

  forgotPassword: async (email: string): Promise<void> => {
    const payload: ForgotPasswordRequestDto = { email };
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.FORGOT_PASSWORD, payload);
  },

  resetPassword: async (payload: ResetPasswordRequestDto): Promise<void> => {
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.RESET_PASSWORD, payload);
  },

  changePassword: async (payload: ChangePasswordRequestDto): Promise<void> => {
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.CHANGE_PASSWORD, payload);
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.BFF.LOGOUT, {});
  },
};
