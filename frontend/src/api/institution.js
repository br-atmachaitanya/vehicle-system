import client from './client'

export const institutionApi = {
  // GET /api/institution/
  get: () => client.get('/api/institution/'),

  // POST /api/institution/  (first time setup)
  create: (data) => client.post('/api/institution/', data),

  // PUT /api/institution/  (update existing)
  update: (data) => client.put('/api/institution/', data),
}