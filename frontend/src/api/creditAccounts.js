import client from './client'

export const creditAccountApi = {
  list: () => client.get('/api/credit-accounts'),
}