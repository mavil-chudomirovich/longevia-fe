import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { UserDto } from '@/features/auth/types/auth.dto';
import type { UserModel } from '@/features/auth/types/auth.model';
import type { ProfileFormValues } from '../schemas/profile.schema';
import type { UpdateProfileDto } from '../types/profile.dto';
import { profileMapper } from '../mappers/profile.mapper';

export const profileApi = {
  getMe: async (): Promise<UserModel> => {
    const response = await api.get<UserDto>(API_ENDPOINTS.IDENTITY.USERS.ME);
    return authMapper.toModel(response.data);
  },
  update: async (values: ProfileFormValues): Promise<UserModel> => {
    const payload: UpdateProfileDto = profileMapper.toUpdateDto(values);
    const response = await api.put<UserDto>(API_ENDPOINTS.IDENTITY.USERS.ME_PROFILE, payload, {
      silent: true,
    });
    return authMapper.toModel(response.data);
  },
};
