import api from './axios';

export const getLeads = () => api.get('/leads');
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const convertLead = (id) => api.post(`/leads/${id}/convert`);
export const getLeadsByStatus = (status) => api.get(`/leads/status/${status}`);
