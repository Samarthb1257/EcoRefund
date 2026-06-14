import api from './axiosConfig';
import { AuthResponse, UserRole } from '../types';

export const authApi = {
  login: async (email: string, password: string, role: UserRole): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password, role });
    return data.data;
  },

  refreshToken: async (accessToken: string, refreshToken: string) => {
    const { data } = await api.post('/auth/refresh-token', { accessToken, refreshToken });
    return data.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.clear();
  },
};
