import client from './client'

export const accountApi = {
  list: (search = '') =>
    client.get('/api/accounts', { params: search ? { search } : {} }),
  get: (code) =>
    client.get(`/api/accounts/${code}`),
  create: (data) =>
    client.post('/api/accounts', data),
  update: (code, data) =>
    client.put(`/api/accounts/${code}`, data),
  delete: (code) =>
    client.delete(`/api/accounts/${code}`),
}