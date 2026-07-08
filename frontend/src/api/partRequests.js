import api from './axios';

export const getPartRequests = () => api.get('/part-requests');
export const getPartRequest = (id) => api.get(`/part-requests/${id}`);
export const createPartRequest = (data) => api.post('/part-requests', data);
export const decidePartRequest = (id, decision, rejectionReason) => api.patch(`/part-requests/${id}/decide`, { decision, rejectionReason });
export const getPendingPartRequestsCount = () => api.get('/part-requests/count/pending');
