import api from './api';
import { User } from '@/types/user';

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string; refreshToken: string }>('/auth/login', { email, password }),

  signup: (data: { name: string; email: string; password: string; role: string; shopName?: string; shopLocation?: string }) =>
    api.post<{ user: User; token: string }>('/auth/signup', data),

  refreshToken: (refreshToken: string) =>
    api.post<{ token: string }>('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),
};
