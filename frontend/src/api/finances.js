import api from './axios';

export const getFinancialDashboard = () => api.get('/finances/dashboard');
export const getTransactions = (params = {}) => api.get('/finances/transactions', { params });
export const createTransaction = (data) => api.post('/finances/transactions', data);
export const updateTransaction = (id, data) => api.put(`/finances/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/finances/transactions/${id}`);
export const getFinancialCategories = () => api.get('/finances/categories');
