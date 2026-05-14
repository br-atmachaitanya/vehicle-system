import client from './client'

export const authApi = {
  login: (username, password) =>
    client.post('/api/auth/login', { username, password }),

  me: () =>
    client.get('/api/auth/me'),

  changePassword: (currentPassword, newPassword) =>
    client.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  setupInit: (adminUsername, adminPassword) =>
    client.post('/api/setup/init', {
      admin_username: adminUsername,
      admin_password: adminPassword,
    }),

  setupStatus: () =>
    client.get('/api/setup/status'),
}