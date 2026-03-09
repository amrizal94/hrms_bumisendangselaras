import axios from 'axios'
import Cookies from 'js-cookie'
import { API_BASE_URL, TOKEN_KEY } from './constants'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — skip login endpoint to avoid redirect loop
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      Cookies.remove(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
