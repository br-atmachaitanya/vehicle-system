import client from './client'

export const fixedRateApi = {
  list: () => client.get('/api/fixed-rates'),
}