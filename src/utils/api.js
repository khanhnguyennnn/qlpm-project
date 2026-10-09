import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401 || 
      (error.response?.status === 403 && typeof error.response?.data?.error === 'string' && error.response.data.error.toLowerCase().includes('token'));
    if (isAuthError && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
