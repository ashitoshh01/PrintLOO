import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, setUser, setToken, logout } = useAuthStore();
  
  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout
  };
};
