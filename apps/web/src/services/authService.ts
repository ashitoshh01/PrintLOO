import api from './api';
import { User } from '@/types/user';

export const authService = {
  sendOtp: (email: string) =>
    api.post<{ success: boolean; message: string; devOtp?: string }>('/auth/send-otp', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post<{ success: boolean; message: string }>('/auth/verify-otp', { email, otp }),

  login: (email: string, password: string) =>
    api.post<{ user: User; token: string; refreshToken: string }>('/auth/login', { email, password }),

  signup: (data: { name: string; email: string; password: string; role: string; shopName?: string; shopLocation?: string; shopLatitude?: number; shopLongitude?: number }) =>
    api.post<{ user: User; token: string; refreshToken?: string }>('/auth/signup', data),

  refreshToken: (refreshToken: string) =>
    api.post<{ token: string }>('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),
};
