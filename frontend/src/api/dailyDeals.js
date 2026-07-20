import api from './axios';

export const getDailyDeals = () => api.get('/daily-deals');
export const getDailyDeal = (id) => api.get(`/daily-deals/${id}`);
export const createDailyDeal = (data) => api.post('/daily-deals', data);
export const updateDailyDeal = (id, data) => api.put(`/daily-deals/${id}`, data);
export const deleteDailyDeal = (id) => api.delete(`/daily-deals/${id}`);

// Public endpoint (no auth needed)
const PUBLIC_API = import.meta.env.VITE_API_URL || '/api';
export const getActiveDeals = () => fetch(`${PUBLIC_API}/daily-deals/public/active`).then(r => r.json());
