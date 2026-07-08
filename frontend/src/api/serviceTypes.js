import api from './axios';

export const getServiceTypes = () => api.get('/service-types');
export const getServiceType = (id) => api.get(`/service-types/${id}`);
export const createServiceType = (data) => api.post('/service-types', data);
export const updateServiceType = (id, data) => api.put(`/service-types/${id}`, data);
export const deleteServiceType = (id) => api.delete(`/service-types/${id}`);
