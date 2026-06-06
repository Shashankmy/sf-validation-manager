import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchValidationRules,
  toggleValidationRule,
  deployRules,
  logoutUser
} from '../api/sfApi'
import RuleCard from '../components/RuleCard'
import styles from './Dashboard.module.css'

function Dashboard({ authStatus, setAuthStatus }) {
  const navigate = useNavigate()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [pendingChanges, setPendingChanges] = useState({}) // tracks unsaved toggles

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3500)
  }

  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 4000)
  }

  const loadRules = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchValidationRules()
      setRules(res.data.rules)
      setPendingChanges({})
    } catch (err) {
      if (err.response?.status === 401) {
        showError('Session expired. Please login again.')
        navigate('/')
      } else {
        showError('Failed to fetch validation rules. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleToggle = (ruleId, newStatus) => {
    // update local state immediately for responsive UI
    setRules(prev =>
      prev.map(r => r.id === ruleId ? { ...r, active: newStatus } : r)
    )
    // track this as a pending change
    setPendingChanges(prev => ({ ...prev, [ruleId]: newStatus }))
  }

  const handleToggleAll = (makeActive) => {
    const updates = {}
    rules.forEach(r => { updates[r.id] = makeActive })
    setRules(prev => prev.map(r => ({ ...r, active: makeActive })))
    setPendingChanges(updates)
  }

  const handleDeploy = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      showError('No changes to deploy. Toggle some rules first.')
      return
    }

    setDeploying(true)
    setError('')
    try {
      const rulesPayload = Object.entries(pendingChanges).map(([id, active]) => ({
        id,
        active
      }))

      const res = await deployRules(rulesPayload)
      const data = res.data

      if (data.success) {
        showSuccess(`✓ Deployed successfully! ${data.message}`)
        setPendingChanges({})
        // refresh rules from server to confirm
        await loadRules()
      } else {
        showError(`Deploy partially failed: ${data.message}`)
      }
    } catch (err) {
      showError('Deploy failed. Please check your connection and try again.')
    } finally {
      setDeploying(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (e) {
      // ignore errors on logout
    }
    setAuthStatus({ logged_in: false })
    navigate('/')
  }

  const activeCount = rules.filter(r => r.active).length
  const inactiveCount = rules.filter(r => !r.active).length
  const pendingCount = Object.keys(pendingChanges).length

  return (
    <div className={styles.wrapper}>
      {/* top navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <span className={styles.navIcon}>☁</span>
          <span className={styles.navTitle}>SF Validation Manager</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.userInfo}>
            {authStatus.user_name || 'Salesforce User'}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.container}>
        {/* page heading */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Account Validation Rules</h1>
            <p className={styles.pageSubtitle}>
              View, toggle, and deploy validation rules for the Account object
            </p>
          </div>
        </div>

        {/* status messages */}
        {error && <div className={styles.errorAlert}>{error}</div>}
        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

        {/* stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{rules.length}</span>
            <span className={styles.statLabel}>Total Rules</span>
          </div>
          <div className={`${styles.statCard} ${styles.activeCard}`}>
            <span className={styles.statNum}>{activeCount}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={`${styles.statCard} ${styles.inactiveCard}`}>
            <span className={styles.statNum}>{inactiveCount}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
          {pendingCount > 0 && (
            <div className={`${styles.statCard} ${styles.pendingCard}`}>
              <span className={styles.statNum}>{pendingCount}</span>
              <span className={styles.statLabel}>Pending Changes</span>
            </div>
          )}
        </div>

        {/* action buttons */}
        <div className={styles.actionsBar}>
          <div className={styles.leftActions}>
            <button
              className={styles.btnPrimary}
              onClick={loadRules}
              disabled={loading}
            >
              {loading ? 'Loading...' : '↻ Fetch Rules'}
            </button>
            <button
              className={styles.btnSuccess}
              onClick={() => handleToggleAll(true)}
              disabled={loading || rules.length === 0}
            >
              Enable All
            </button>
            <button
              className={styles.btnDanger}
              onClick={() => handleToggleAll(false)}
              disabled={loading || rules.length === 0}
            >
              Disable All
            </button>
          </div>
          <button
            className={`${styles.btnDeploy} ${pendingCount > 0 ? styles.btnDeployActive : ''}`}
            onClick={handleDeploy}
            disabled={deploying || pendingCount === 0}
          >
            {deploying ? 'Deploying...' : `🚀 Deploy Changes${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
        </div>

        {/* rules list */}
        <div className={styles.rulesSection}>
          {loading && (
            <div className={styles.loadingState}>
              <p>Fetching validation rules from Salesforce...</p>
            </div>
          )}

          {!loading && rules.length === 0 && (
            <div className={styles.emptyState}>
              <p>No validation rules found. Click "Fetch Rules" to load them.</p>
            </div>
          )}

          {!loading && rules.length > 0 && (
            <div className={styles.rulesList}>
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  hasPendingChange={pendingChanges.hasOwnProperty(rule.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
