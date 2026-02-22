import React, { useState } from 'react';
import { getPatientStatus } from '../services/api';
import styles from './StatusChecker.module.css';

const STATUS_LABELS = {
  waiting: 'Waiting',
  called: 'Called! 🔔',
  done: 'Done',
};

export default function StatusChecker() {
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setData(null);
    setError('');
    try {
      const result = await getPatientStatus(patientId.trim());
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Your Patient ID</label>
        <div className={styles.row}>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter your Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <button
            className={styles.btn}
            onClick={handleCheck}
            disabled={loading || !patientId.trim()}
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
          </div>
          {data.status === 'called' && (
            <div className={styles.calledAlert}>
              🔔 It's your turn! Please proceed to the doctor's room.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
