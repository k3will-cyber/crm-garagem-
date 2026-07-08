import api from './axios';

export const getServiceOrders = () => api.get('/service-orders');
export const getServiceOrder = (id) => api.get(`/service-orders/${id}`);
export const createServiceOrder = (data) => api.post('/service-orders', data);
export const updateServiceOrder = (id, data) => api.put(`/service-orders/${id}`, data);
export const deleteServiceOrder = (id) => api.delete(`/service-orders/${id}`);
export const updateServiceOrderStatus = (id, status) => api.patch(`/service-orders/${id}/status`, { status });
export const toggleNotifications = (id) => api.patch(`/service-orders/${id}/toggle-notifications`);
export const getServiceOrdersByStatus = (status) => api.get(`/service-orders/status/${status}`);
export const getDashboardStats = () => api.get('/service-orders/dashboard/stats');
export const getDashboardRevenue = () => api.get('/service-orders/dashboard/revenue');
