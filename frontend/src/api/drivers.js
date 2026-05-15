import client from './client'

export const driverApi = {
  list: () => client.get('/api/drivers'),
  get: (code) => client.get(`/api/drivers/${code}`),
  create: (data) => client.post('/api/drivers', data),
  update: (code, data) => client.put(`/api/drivers/${code}`, data),
  delete: (code) => client.delete(`/api/drivers/${code}`),
}