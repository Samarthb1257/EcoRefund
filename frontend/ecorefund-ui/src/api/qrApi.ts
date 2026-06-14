import api from './axiosConfig';

export const qrApi = {
  generate: async (data: {
    itemTypeId: string;
    locationId: string;
    depositAmount: number;
    description?: string;
    validityDays?: number;
  }) => {
    const res = await api.post('/qrcodes/generate', data);
    return res.data;
  },

  scan: async (qrCodeData: string, deviceInfo?: string) => {
    const res = await api.post('/qrcodes/scan', { qrCodeData, deviceInfo });
    return res.data;
  },

  getAll: async (page = 1, pageSize = 20, status?: number) => {
    const res = await api.get('/qrcodes', { params: { page, pageSize, status } });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/qrcodes/${id}`);
    return res.data;
  },

  getPrintLabel: async (id: string) => {
    const res = await api.get(`/qrcodes/${id}/print`, { responseType: 'blob' });
    return res.data;
  },
};
