import client from './client'

export const userApi = {
  list: (search = '') =>
    client.get('/api/users', { params: search ? { search } : {} }),
  get: (code) =>
    client.get(`/api/users/${code}`),
  create: (data) =>
    client.post('/api/users', data),
  update: (code, data) =>
    client.put(`/api/users/${code}`, data),
  delete: (code) =>
    client.delete(`/api/users/${code}`),
}