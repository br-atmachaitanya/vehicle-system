import client from './client'

export const reportsApi = {
  // Each function has two modes:
  // format='json' → returns data for browser preview
  // format='pdf'  → returns blob for download

  accountBill: (params) =>
    client.get('/api/reports/account-bill', { params }),

  creditBill: (params) =>
    client.get('/api/reports/credit-bill', { params }),

  logBook: (params) =>
    client.get('/api/reports/log-book', { params }),

  driverLogBook: (params) =>
    client.get('/api/reports/driver-log-book', { params }),

  incomeExpenditure: (params) =>
    client.get('/api/reports/income-expenditure', { params }),

  certificateRegister: (params) =>
    client.get('/api/reports/certificate-register', { params }),

  // For PDF download — needs special responseType: 'blob'
  downloadPdf: (endpoint, params) =>
    client.get(`/api/reports/${endpoint}`, {
      params: { ...params, format: 'pdf' },
      responseType: 'blob',   // tells axios to handle binary response
    }),
}