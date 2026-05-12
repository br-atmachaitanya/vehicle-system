import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8080',  // all requests go to our FastAPI server
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  response => response,  // if success, just return the response
  error => {
    // error.response.data.detail is how FastAPI sends error messages
    const message = error.response?.data?.detail || 'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(error)  // still pass the error along to the caller
  }
)

export default client