import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: BASE_URL,
})

// ── Request: adjunta access token ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: refresca token expirado automáticamente ──────────────────────
let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')
      const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken })
      localStorage.setItem('access_token', data.access)
      api.defaults.headers.common.Authorization = `Bearer ${data.access}`
      processQueue(null, data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch (err) {
      processQueue(err, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
