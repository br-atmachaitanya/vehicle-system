import client from "./client"

export const vehicleApi = {
    list: (activeOnly = false) =>
        client.get('/api/vehicles', { params: { active_only: activeOnly } }),

  // GET /api/vehicles/4000
    get: (code) =>
        client.get(`/api/vehicles/${code}`),


    create: (data) =>
        client.post('/api/vehicles', data),

    update: (code, data) =>
        client.put(`/api/vehicles/${code}`, data),


    delete: (code) =>
        client.delete(`/api/vehicles/${code}`),
}