import api from './axios';

export const getParts = () => api.get('/parts');
export const getPart = (id) => api.get(`/parts/${id}`);
export const createPart = (data) => api.post('/parts', data);
export const updatePart = (id, data) => api.put(`/parts/${id}`, data);
export const deletePart = (id) => api.delete(`/parts/${id}`);
export const getLowStockParts = () => api.get('/parts/stock/low-stock');
export const getPartMovements = (id) => api.get(`/parts/${id}/movements`);
export const getAllStockMovements = () => api.get('/parts/stock/movements/all');
export const addStockIn = (id, data) => api.post(`/parts/${id}/stock-in`, data);
