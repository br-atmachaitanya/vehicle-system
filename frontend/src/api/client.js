import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// Helper — extract a readable message from any FastAPI error shape
const extractErrorMessage = (error) => {
  const data = error.response?.data

  if (!data) return 'Network error — is the server running?'

  // FastAPI validation errors come as array of {msg, loc} objects
  if (Array.isArray(data.detail)) {
    return data.detail
      .map(e => {
        // loc is like ["query", "date_to"] — show the field name
        const field = e.loc?.slice(-1)[0] || 'field'
        return `${field}: ${e.msg}`
      })
      .join(' | ')
  }

  // Normal string error
  if (typeof data.detail === 'string') return data.detail

  // Fallback
  return JSON.stringify(data)
}

client.interceptors.response.use(
  response => response,
  error => {
    const message = extractErrorMessage(error)
    console.error('API Error:', message)

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      delete client.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }

    // Attach readable message to error so callers can use it
    error.readableMessage = message
    return Promise.reject(error)
  }
)

export default client