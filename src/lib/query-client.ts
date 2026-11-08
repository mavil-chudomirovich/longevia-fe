import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          // Không retry nếu lỗi 4xx (do client gửi sai param hoặc unauthorized)
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          if (status && status >= 400 && status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
