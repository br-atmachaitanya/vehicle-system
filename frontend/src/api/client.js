import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || 'Something went wrong'
    console.error('API Error:', message)

    // If token expired or invalid → force logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      delete client.defaults.headers.common['Authorization']
      // Redirect to login — works even outside React components
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default client