import api from './axiosConfig';
import { UserRole } from '../types';

export const userApi = {
  getAll: async (page = 1, pageSize = 20, role?: UserRole) => {
    const res = await api.get('/users', { params: { page, pageSize, role } });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  create: async (data: Record<string, unknown>) => {
    const res = await api.post('/users', data);
    return res.data;
  },

  toggleLogin: async (id: string, isLoginEnabled: boolean, reason?: string) => {
    const res = await api.patch(`/users/${id}/toggle-login`, { isLoginEnabled, reason });
    return res.data;
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/users/${id}/toggle-active`, { isActive });
    return res.data;
  },

  resetPassword: async (id: string, newPassword: string) => {
    const res = await api.post(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },

  getLoginStatus: async () => {
    const res = await api.get('/users/login-status');
    return res.data;
  },
};
