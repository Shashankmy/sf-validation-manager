import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_access_token')
  const instanceUrl = localStorage.getItem('sf_instance_url')
  if (token) {
    config.headers['X-SF-Access-Token'] = token
    config.headers['X-SF-Instance-URL'] = instanceUrl
  }
  return config
})

export const checkAuthStatus = () => api.get('/auth/status/')
export const logoutUser = () => api.post('/auth/logout/')
export const fetchValidationRules = () => api.get('/api/rules/')
export const toggleValidationRule = (ruleId, active) =>
  api.post(`/api/rules/${ruleId}/toggle/`, { active })
export const deployRules = (rules) =>
  api.post('/api/rules/deploy/', { rules })

export default api