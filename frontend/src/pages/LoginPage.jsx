import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LoginPage.module.css'

function LoginPage({ authStatus }) {
  const navigate = useNavigate()

  useEffect(() => {
    // if already logged in just go to dashboard
    if (authStatus && authStatus.logged_in) {
      navigate('/dashboard')
    }
  }, [authStatus])

  const handleLogin = () => {
    // redirect to django backend which then redirects to salesforce
    window.location.href = 'http://localhost:8000/auth/login/'
  }

  // check for error param in url (e.g after failed oauth)
  const urlParams = new URLSearchParams(window.location.search)
  const errorMsg = urlParams.get('error')

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.sfIcon}>☁</div>
          <h1 className={styles.title}>SF Validation Manager</h1>
          <p className={styles.subtitle}>
            Manage your Salesforce Account validation rules from one place
          </p>
        </div>

        {errorMsg && (
          <div className={styles.errorBox}>
            <p>⚠ Login failed: {decodeURIComponent(errorMsg)}</p>
          </div>
        )}

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>View all validation rules</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Toggle rules on or off instantly</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Deploy changes directly to your org</span>
          </div>
        </div>

        <button className={styles.loginBtn} onClick={handleLogin}>
          <span className={styles.btnIcon}>🔐</span>
          Login with Salesforce
        </button>

        <p className={styles.note}>
          You will be redirected to Salesforce to authorize this application
        </p>
      </div>
    </div>
  )
}

export default LoginPage
