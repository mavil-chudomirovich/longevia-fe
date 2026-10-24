import api from '@/lib/axios';
import axios from 'axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import {
  AuthSessionResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  LogoutResponseDto,
  ProfileResponseDto,
  RefreshResponseDto,
} from '../types/auth.dto';
import { AuthSession, LogoutResult, User } from '../types/auth.model';
import type { RegisterFormValues } from '../schemas/auth.schema';
import { LogoutScope } from '@/common/enums';
import { authMapper } from '../mappers/auth.mapper';

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Ghi chú P3 (FR-011): Đăng nhập Google/Apple CHƯA được tích hợp vì backend chưa
 * công bố endpoint OAuth trong contract đã `READY` (`docs/api/auth.md`).
 * Nút Google/Apple trên UI chỉ là placeholder ("sẽ sớm khả dụng"), không gọi API,
 * không xử lý callback, không suy diễn role/quyền. Không đánh dấu hoàn thành
 * trong `BACKEND_INTEGRATION.md` cho tới khi backend chốt contract.
 */

export const authApi = {
  register: async (values: RegisterFormValues): Promise<AuthSession> => {
    const payload = authMapper.toRegisterDto(values);
    // Đi qua Next proxy để BE Set-Cookie được forward về domain Next
    const res = await axios.post<AuthSessionResponseDto>('/api/auth/register', payload, {
      baseURL: '',
      showErrorToast: true,
    });
    return authMapper.toSessionModel(res.data);
  },

  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const body: LoginRequestDto = { email: payload.email, password: payload.password };
    const res = await axios.post<AuthSessionResponseDto>('/api/auth/login', body, {
      baseURL: '',
      showErrorToast: true,
    });
    return authMapper.toSessionModel(res.data);
  },

  getMe: async (): Promise<User> => {
    // `ProfileResponseDto` đã là envelope — đọc `res.data` trực tiếp.
    const res = await api.get<ProfileResponseDto>(API_ENDPOINTS.USERS.ME);
    return authMapper.toProfileModel(res.data);
  },

  refreshToken: async (): Promise<string> => {
    // Luôn đi qua Next proxy để forward HttpOnly cookie refreshToken.
    const res = await axios.post<RefreshResponseDto>(
      '/api/auth/refresh-token',
      {},
      { baseURL: '' }
    );
    const raw = res.data as RefreshResponseDto & { accessToken?: string };
    // Proxy forward nguyên JSON của BE (`{success,data,meta}`); phòng hờ payload phẳng.
    const envelope: RefreshResponseDto =
      raw && typeof raw === 'object' && 'accessToken' in raw && !('data' in raw)
        ? { data: raw as RefreshResponseDto['data'] }
        : raw;
    return authMapper.toRefreshedTokenModel(envelope).accessToken;
  },

  logout: async (opts?: { allDevices?: boolean }): Promise<LogoutResult> => {
    // Gọi Next handler để vừa proxy BE vừa xóa HttpOnly cookie cùng-domain.
    // Dùng axios thô (baseURL '') để tránh interceptor tự gắn refresh loop.
    const body: LogoutRequestDto = { allDevices: opts?.allDevices ?? false };
    try {
      const res = await axios.post<LogoutResponseDto>('/api/auth/logout', body, { baseURL: '' });
      return authMapper.toLogoutResultModel(res.data);
    } catch {
      // BE down vẫn cho logout client, interceptor đã silent
      try {
        const res = await api.post<LogoutResponseDto>(API_ENDPOINTS.AUTH.LOGOUT, body, {
          silent: true,
        });
        return authMapper.toLogoutResultModel(res.data);
      } catch {
        return {
          loggedOut: true,
          scope: body.allDevices ? LogoutScope.ALL_DEVICES : LogoutScope.CURRENT,
        };
      }
    }
  },
};
