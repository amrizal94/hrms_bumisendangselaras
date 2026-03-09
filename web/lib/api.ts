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

// Handle errors globally — extract backend message for user-friendly display
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      Cookies.remove(TOKEN_KEY)
      window.location.href = '/login'
    }
    // Replace raw axios message with backend's message if available
    const backendMessage = error.response?.data?.message
    if (backendMessage) {
      error.message = backendMessage
    }
    return Promise.reject(error)
  }
)
