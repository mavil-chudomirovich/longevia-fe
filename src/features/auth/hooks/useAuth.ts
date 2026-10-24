import { useAuthStore } from '@/store/useAuthStore';
import {
  useCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from '../queries/auth.queries';

export function useAuth() {
  const { user, token, isAuthenticated } = useAuthStore();
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const userQuery = useCurrentUserQuery();

  return {
    user,
    token,
    isAuthenticated,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    isLoadingUser: userQuery.isLoading,
  };
}
