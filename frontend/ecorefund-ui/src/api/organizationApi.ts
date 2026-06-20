import api from './axiosConfig';

export const organizationApi = {
  register: async (data: Record<string, unknown>) => {
    const res = await api.post('/organizations/register', data);
    return res.data;
  },

  getAll: async (page = 1, pageSize = 20, search?: string) => {
    const res = await api.get('/organizations', { params: { page, pageSize, search } });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/organizations/${id}`);
    return res.data;
  },

  getDashboard: async (id: string) => {
    const res = await api.get(`/organizations/${id}/dashboard`);
    return res.data;
  },

  toggleLogin: async (id: string, isLoginEnabled: boolean) => {
    const res = await api.patch(`/organizations/${id}/toggle-login`, { isLoginEnabled });
    return res.data;
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/organizations/${id}/toggle-active`, { isActive });
    return res.data;
  },

  getPlatformStats: async () => {
    const res = await api.get('/organizations/platform-stats');
    return res.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put(`/organizations/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/organizations/${id}`);
    return res.data;
  },
};
