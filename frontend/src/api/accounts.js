import client from './client'

export const accountApi = {
  // search param filters by name — useful for 352 accounts
  list: (search = '') =>
    client.get('/api/accounts', { params: search ? { search } : {} }),
  get: (code) => client.get(`/api/accounts/${code}`),
}