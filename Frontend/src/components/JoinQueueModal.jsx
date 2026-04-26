import React, { useState, useEffect } from 'react';
import { joinQueue } from '../services/api';
import styles from './JoinQueueModal.module.css';

export default function JoinQueueModal({ doctor, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', message }

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleJoin = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await joinQueue(doctor.id);
      setResult({
        type: 'success',
        message: `Joined! Your ticket number is #${data.data.ticket_number}.`,
      });
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.badge}>✚</div>
        <h2 className={styles.title}>Join Queue</h2>
        <p className={styles.sub}>Dr. {doctor.name} — {doctor.specialization || 'General'}</p>

        <p className={styles.sub}>Your account identity is attached automatically from your active session.</p>

        {result && (
          <div className={`${styles.resultBox} ${styles[result.type]}`}>
            {result.type === 'success' ? '✓' : '✕'} {result.message}
          </div>
        )}

        {result?.type !== 'success' ? (
          <button className={styles.btn} onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining…' : 'Confirm & Join'}
          </button>
        ) : (
          <button className={styles.btnSecondary} onClick={onClose}>Done</button>
        )}
      </div>
    </div>
  );
}
