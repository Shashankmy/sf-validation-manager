import React from 'react'
import styles from './RuleCard.module.css'

function RuleCard({ rule, hasPendingChange, onToggle }) {
  const handleToggle = () => {
    onToggle(rule.id, !rule.active)
  }

  return (
    <div className={`${styles.card} ${hasPendingChange ? styles.cardPending : ''}`}>
      <div className={styles.left}>
        <div className={styles.nameRow}>
          <span className={styles.ruleName}>{rule.name}</span>
          {hasPendingChange && (
            <span className={styles.pendingBadge}>unsaved</span>
          )}
        </div>
        {rule.error_message && (
          <p className={styles.errorMsg}>
            <span className={styles.errorLabel}>Error: </span>
            {rule.error_message}
          </p>
        )}
        {rule.description && (
          <p className={styles.description}>{rule.description}</p>
        )}
        <p className={styles.ruleId}>ID: {rule.id}</p>
      </div>

      <div className={styles.right}>
        <span className={`${styles.statusBadge} ${rule.active ? styles.active : styles.inactive}`}>
          {rule.active ? 'Active' : 'Inactive'}
        </span>
        <button
          className={`${styles.toggleBtn} ${rule.active ? styles.toggleOff : styles.toggleOn}`}
          onClick={handleToggle}
          title={rule.active ? 'Click to deactivate' : 'Click to activate'}
        >
          {rule.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
}

export default RuleCard
