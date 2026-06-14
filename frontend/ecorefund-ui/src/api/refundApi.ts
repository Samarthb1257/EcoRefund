import api from './axiosConfig';
import { RefundMethod } from '../types';

export const refundApi = {
  process: async (data: {
    qrCodeId: string;
    refundMethod: RefundMethod;
    upiId?: string;
    couponCode?: string;
    notes?: string;
  }) => {
    const res = await api.post('/refunds/process', data);
    return res.data;
  },

  getAll: async (page = 1, pageSize = 20, from?: string, to?: string) => {
    const res = await api.get('/refunds', { params: { page, pageSize, from, to } });
    return res.data;
  },

  getSummary: async (from?: string, to?: string) => {
    const res = await api.get('/refunds/summary', { params: { from, to } });
    return res.data;
  },
};
