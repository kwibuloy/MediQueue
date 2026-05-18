import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getAccessToken, getPatientStatus, cancelQueue } from '../services/api';
import styles from './StatusChecker.module.css';

const STATUS_LABELS = {
  waiting: 'Waiting',
  called: 'Called! 🔔',
  done: 'Done',
};

/** Stable string so unchanged polls keep the same `data` reference (avoids visual flicker). */
function queueStatusFingerprint(row) {
  if (!row || typeof row !== 'object' || Object.keys(row).length === 0) return '__empty__';
  return `${row.queue_id}|${row.ticket_number}|${row.status}|${row.position_in_queue}`;
}

export default function StatusChecker() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [canceling, setCanceling] = useState(false);
  const hasToken = !!getAccessToken();
  const noteTimerRef = useRef(null);

  const handleCheck = useCallback(async ({ background = false } = {}) => {
    if (!getAccessToken()) return;

    if (!background) {
      setLoading(true);
      setError('');
    }

    try {
      const result = await getPatientStatus();
      const hasData = result && Object.keys(result).length > 0;
      const next = hasData ? result : null;
      const fp = queueStatusFingerprint(next);

      setData((prev) => (queueStatusFingerprint(prev) === fp ? prev : next));
      setError('');
      if (!hasData) setNote('');
    } catch (err) {
      if (!background) setError(err.message);
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return undefined;
    handleCheck();
    const interval = setInterval(() => handleCheck({ background: true }), 7000);
    return () => {
      clearInterval(interval);
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    };
  }, [hasToken, handleCheck]);

  const estimatedWait =
    data && data.status === 'waiting' && Number.isFinite(Number(data.position_in_queue))
      ? `${Number(data.position_in_queue) * 10} mins`
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
              <span className={styles.statLabel}>Estimated Time</span>
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
        Live updates active (auto-refresh every 7s).
      </p>
      {note && <p className={styles.error}>{note}</p>}
    </div>
  );
}
