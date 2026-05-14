import client from './client'

export const driverApi = {
  list: () => client.get('/api/drivers'),
}