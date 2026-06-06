import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,   // needed so session cookies are sent along
  headers: {
    'Content-Type': 'application/json',
  },
})

export const checkAuthStatus = () => api.get('/auth/status/')

export const logoutUser = () => api.post('/auth/logout/')

export const fetchValidationRules = () => api.get('/api/rules/')

export const toggleValidationRule = (ruleId, active) =>
  api.post(`/api/rules/${ruleId}/toggle/`, { active })

export const deployRules = (rules) =>
  api.post('/api/rules/deploy/', { rules })

export default api
