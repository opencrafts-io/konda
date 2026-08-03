// ReentryModal.jsx
import React from 'react';
import style from './ReentryModal.module.css';

const ReentryModal = ({ data, onDecision, onClose }) => {
  const isWithinGracePeriod = data?.isWithinGracePeriod || false;
  const daysRemaining = data?.daysRemaining || 0;
  const deletionReason = data?.deletionReason || 'User requested deletion';
  const deletedAt = data?.deletedAt ? new Date(data.deletedAt).toLocaleDateString() : 'Unknown';

  return (
    <div className={style.modalOverlay} onClick={onClose}>
      <div className={style.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={style.closeBtn} onClick={onClose}>×</button>
        
        <div className={style.modalHeader}>
          <h2>Welcome Back!</h2>
          <p>We found a previously deleted account associated with this email.</p>
        </div>

        <div className={style.accountInfo}>
          <div className={style.infoCard}>
            <span className={style.infoLabel}>Account Deleted On</span>
            <span className={style.infoValue}>{deletedAt}</span>
          </div>
          <div className={style.infoCard}>
            <span className={style.infoLabel}>Deletion Reason</span>
            <span className={style.infoValue}>{deletionReason}</span>
          </div>
        </div>

        {isWithinGracePeriod ? (
          <div className={style.gracePeriodSection}>
            <div className={style.gracePeriodBadge}>
              <span className={style.badgeIcon}>⏳</span>
              <span>Grace Period Active</span>
            </div>
            <p className={style.gracePeriodText}>
              Your account is still within the <strong>{daysRemaining} day(s)</strong> grace period.
              You can restore your previous account with all your data intact.
            </p>
            <div className={style.actionButtons}>
              <button 
                className={`${style.actionBtn} ${style.primaryBtn}`}
                onClick={() => onDecision('restore')}
              >
                <span>🔄</span> Restore Account
              </button>
              <button 
                className={`${style.actionBtn} ${style.secondaryBtn}`}
                onClick={() => onDecision('new_account')}
              >
                <span>✨</span> Fresh Start
              </button>
            </div>
            <p className={style.noteText}>
              <small>Note: Choosing "Fresh Start" will create a new account and your previous data will be permanently deleted after the grace period.</small>
            </p>
          </div>
        ) : (
          <div className={style.expiredSection}>
            <div className={style.expiredBadge}>
              <span className={style.badgeIcon}>⏰</span>
              <span>Grace Period Expired</span>
            </div>
            <p className={style.expiredText}>
              The <strong>30-day grace period</strong> has expired. Your previous data has been permanently deleted for privacy and security reasons.
            </p>
            <p className={style.expiredText}>
              Would you like to create a new account with a fresh start?
            </p>
            <div className={style.actionButtons}>
              <button 
                className={`${style.actionBtn} ${style.primaryBtn}`}
                onClick={() => onDecision('new_account')}
              >
                <span>✨</span> Create New Account
              </button>
            </div>
          </div>
        )}

        <div className={style.privacyNote}>
          <p>
            <small>
              We process your data in accordance with our 
              <a href="/privacy" className={style.link}> Privacy Policy</a> and 
              <a href="/terms" className={style.link}> Terms of Service</a>.
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReentryModal;