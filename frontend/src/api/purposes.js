import client from './client'

export const purposeApi = {
  list: (search = '') =>
    client.get('/api/purposes', { params: search ? { search } : {} }),
  create: (text) => client.post('/api/purposes', { text }),
}