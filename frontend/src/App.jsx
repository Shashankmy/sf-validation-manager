import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import { checkAuthStatus } from './api/sfApi'
import api from './api/sfApi'

function App() {
  const [authStatus, setAuthStatus] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const accessToken = urlParams.get('access_token')
    const instanceUrl = urlParams.get('instance_url')
    const userName = urlParams.get('user_name')
    const userEmail = urlParams.get('user_email')

    if (accessToken && instanceUrl) {
      // store in localStorage for use across page loads
      localStorage.setItem('sf_access_token', accessToken)
      localStorage.setItem('sf_instance_url', instanceUrl)
      localStorage.setItem('sf_user_name', userName || 'Salesforce User')
      localStorage.setItem('sf_user_email', userEmail || '')

      // also tell backend to store in session
      api.post('/auth/token-login/', {
        access_token: accessToken,
        instance_url: instanceUrl,
        user_name: userName,
        user_email: userEmail,
      }).catch(() => {})

      setAuthStatus({
        logged_in: true,
        user_name: userName || 'Salesforce User',
        user_email: userEmail || '',
        instance_url: instanceUrl,
      })

      navigate('/dashboard', { replace: true })
      return
    }

    // check localStorage first
    const storedToken = localStorage.getItem('sf_access_token')
    if (storedToken) {
      setAuthStatus({
        logged_in: true,
        user_name: localStorage.getItem('sf_user_name') || 'Salesforce User',
        user_email: localStorage.getItem('sf_user_email') || '',
        instance_url: localStorage.getItem('sf_instance_url') || '',
      })
      if (location.pathname === '/') {
        navigate('/dashboard')
      }
      return
    }

    // fallback to session check
    checkAuthStatus()
      .then(res => {
        setAuthStatus(res.data)
        if (res.data.logged_in && location.pathname === '/') {
          navigate('/dashboard')
        }
      })
      .catch(() => {
        setAuthStatus({ logged_in: false })
      })
  }, [])

  if (authStatus === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage authStatus={authStatus} />} />
      <Route
        path="/dashboard"
        element={
          authStatus.logged_in
            ? <Dashboard authStatus={authStatus} setAuthStatus={setAuthStatus} />
            : <Navigate to="/" replace />
        }
      />
    </Routes>
  )
}

export default App