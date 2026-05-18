import React, { useState } from 'react';
import styles from './QueueList.module.css';

export default function QueueList({ queue, onStartSession, onCompleteSession }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleSessionAction = async (queueId, action) => {
    setLoadingId(queueId);
    try {
      if (action === 'start' && onStartSession) {
        await onStartSession(queueId);
      } else if (action === 'complete' && onCompleteSession) {
        await onCompleteSession(queueId);
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (!queue.length) {
    return <div className={styles.empty}>No patients currently waiting.</div>;
  }

  return (
    <div className={styles.list}>
      {queue.map((patient, i) => {
        const id = patient.queue_id ?? patient.id;
        const isNext = i === 0 && patient.status === 'waiting';
        const estimatedWait =
          patient.status === 'waiting'
            ? `${(i + 1) * 10} mins`
            : patient.status === 'called'
              ? 'Now'
              : 'N/A';
        return (
          <div key={id ?? patient.ticket_number} className={`${styles.item} ${isNext ? styles.next : ''}`}>
            <div className={styles.ticket}>{patient.ticket_number}</div>
            <div className={styles.info}>
              <div className={styles.name}>{patient.patient_name}</div>
              <div className={styles.time}>Arrived {patient.arrival_time}</div>
              <div className={styles.time}>Est. wait: {estimatedWait}</div>
              {patient.status && <div className={styles.status}>Status: {patient.status}</div>}
            </div>
            <div className={styles.actions}>
              {patient.status === 'called' && onStartSession && (
                <button
                  className={styles.btnSmall}
                  onClick={() => handleSessionAction(id, 'start')}
                  disabled={loadingId === id}
                >
                  {loadingId === id ? '…' : 'Start'}
                </button>
              )}
              {patient.status === 'in-consultation' && onCompleteSession && (
                <button
                  className={styles.btnSmall}
                  onClick={() => handleSessionAction(id, 'complete')}
                  disabled={loadingId === id}
                >
                  {loadingId === id ? '…' : 'Complete'}
                </button>
              )}
              {patient.status === 'waiting' && (
                <div className={`${styles.pos} ${isNext ? styles.posNext : ''}`}>
                  {isNext ? 'Next up' : `#${i + 1}`}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
