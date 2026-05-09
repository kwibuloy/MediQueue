import React, { useEffect, useState, useRef } from 'react';
import { getAccessToken, getPatientStatus, cancelQueue } from '../services/api';
import styles from './StatusChecker.module.css';

const STATUS_LABELS = {
  waiting: 'Waiting',
  called: 'Called! 🔔',
  done: 'Done',
};

export default function StatusChecker() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [canceling, setCanceling] = useState(false);
  const hasToken = !!getAccessToken();
  const noteTimerRef = useRef(null);

  const handleCheck = async ({ background = false } = {}) => {
    if (!hasToken) return;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError('');
    }

    try {
      const result = await getPatientStatus();
      // backend returns {} when there's no queue entry for today
      const hasData = result && Object.keys(result).length > 0;
      setData(hasData ? result : null);
      setError('');
      if (!hasData) setNote('');
    } catch (err) {
      if (!background) setError(err.message);
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!hasToken) return undefined;
    handleCheck();
    const interval = setInterval(() => handleCheck({ background: true }), 7000);
    return () => {
      clearInterval(interval);
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    };
  }, [hasToken]);

  const estimatedWait =
    data && data.status === 'waiting' && typeof data.position_in_queue === 'number'
      ? `${Math.max((data.position_in_queue - 1) * 10, 0)} mins`
      : data?.status === 'called'
        ? 'Now'
        : 'N/A';

  return (
    <div className={styles.card}>
      <div className={styles.formGroup}>
        <label className={styles.label}>My Queue Status</label>
        <div className={styles.row}>
          <button
            className={styles.btn}
            onClick={() => handleCheck()}
            disabled={loading}
          >
            {loading ? '…' : 'Check'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>✕ {error}</p>}

      {data && (
        <div className={styles.result}>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Ticket</span>
              <span className={styles.statValue}>#{data.ticket_number}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Position</span>
              <span className={styles.statValue}>
                {data.status === 'called' ? '🔔' : data.position_in_queue ?? '—'}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Status</span>
              <span className={`${styles.badge} ${styles[data.status]}`}>
                {STATUS_LABELS[data.status] ?? data.status}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Est. Wait</span>
              <span className={styles.statValue}>{estimatedWait}</span>
            </div>
          </div>
          <div className={styles.row}>
            <button
              className={styles.btn}
              onClick={async () => {
                if (!hasToken) { setNote('Please log in first'); return; }
                setNote('');
                setCanceling(true);
                try {
                  const res = await cancelQueue();
                  setNote(res.message || 'Your spot has been cancelled');
                  // clear local status immediately; next background refresh will confirm
                  setData(null);
                  // clear existing timer and auto-clear note after 4s
                  if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
                  noteTimerRef.current = setTimeout(() => setNote(''), 4000);
                  // refresh status in background to sync with server
                  handleCheck({ background: true });
                } catch (err) {
                  setNote(err.message || 'Failed to cancel your spot');
                } finally {
                  setCanceling(false);
                }
              }}
              disabled={canceling}
            >
              {canceling ? 'Cancelling…' : 'Cancel my spot'}
            </button>
          </div>
          {data.status === 'called' && (
            <div className={styles.calledAlert}>
              🔔 It's your turn! Please proceed to the doctor's room.
            </div>
          )}
        </div>
      )}
      <p className={styles.liveTag}>
        Live updates active (auto-refresh every 7s){refreshing ? ' • syncing…' : ''}.
      </p>
      {note && <p className={styles.error}>{note}</p>}
    </div>
  );
}
