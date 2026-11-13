import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { authMapper } from '../mappers/auth.mapper';
import type {
  AuthTokenDto,
  ChangePasswordRequestDto,
  ConfirmEmailChangeRequestDto,
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
  register: async (values: RegisterFormValues): Promise<void> => {
    const payload: RegisterRequestDto = authMapper.toRegisterDto(values);
    await api.post(API_ENDPOINTS.BFF.REGISTER, payload, {
      silent: true,
    });
  },

  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const response = await api.post<AuthTokenDto>(API_ENDPOINTS.BFF.LOGIN, payload, {
      silent: true,
    });
    const session = authMapper.toSessionModel(response.data);
    if (!session.accessToken)
      throw new Error('Chưa đăng nhập được lúc này. Bạn vui lòng thử lại sau giây lát nhé.');
    return session;
  },

  getMe: async (): Promise<UserModel> => {
    const response = await api.get<UserDto>(API_ENDPOINTS.IDENTITY.USERS.ME);
    return authMapper.toModel(response.data);
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(API_ENDPOINTS.IDENTITY.AUTH.VERIFY, { params: { token }, silent: true });
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.RESEND_VERIFICATION, { email }, { silent: true });
  },

  forgotPassword: async (email: string): Promise<void> => {
    const payload: ForgotPasswordRequestDto = { email };
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.FORGOT_PASSWORD, payload, { silent: true });
  },

  resetPassword: async (payload: ResetPasswordRequestDto): Promise<void> => {
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.RESET_PASSWORD, payload, { silent: true });
  },

  changePassword: async (payload: ChangePasswordRequestDto): Promise<void> => {
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.CHANGE_PASSWORD, payload, { silent: true });
  },

  confirmEmailChange: async (token: string): Promise<void> => {
    const payload: ConfirmEmailChangeRequestDto = { token };
    await api.post(API_ENDPOINTS.IDENTITY.AUTH.CONFIRM_EMAIL_CHANGE, payload, { silent: true });
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.BFF.LOGOUT, {});
  },
};
