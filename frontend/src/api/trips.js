import client from './client'

export const tripApi = {
  // params is an object like { fiscal_year: "2627", vehicle_code: "4000" }
  list: (params) =>
    client.get('/api/trips', { params }),

  get: (id) =>
    client.get(`/api/trips/${id}`),

  create: (data) =>
    client.post('/api/trips', data),

  update: (id, data) =>
    client.put(`/api/trips/${id}`, data),

  delete: (id) =>
    client.delete(`/api/trips/${id}`),

  // Special endpoint — calculates charge without saving to DB
  calculateCharge: (params) =>
    client.post('/api/trips/calculate-charge', null, { params }),
}