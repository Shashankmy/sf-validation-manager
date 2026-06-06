import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import { checkAuthStatus } from './api/sfApi'

function App() {
  const [authStatus, setAuthStatus] = useState(null) // null = still checking
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // check if user is already logged in when app loads
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

  // show nothing while we check auth status
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
