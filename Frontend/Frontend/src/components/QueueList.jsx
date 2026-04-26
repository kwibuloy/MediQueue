import React from 'react';
import styles from './QueueList.module.css';

export default function QueueList({ queue }) {
  if (!queue.length) {
    return <div className={styles.empty}>No patients currently waiting.</div>;
  }

  return (
    <div className={styles.list}>
      {queue.map((patient, i) => (
        <div key={patient.ticket_number} className={`${styles.item} ${i === 0 ? styles.next : ''}`}>
          <div className={styles.ticket}>{patient.ticket_number}</div>
          <div className={styles.info}>
            <div className={styles.name}>{patient.patient_name}</div>
            <div className={styles.time}>Arrived {patient.arrival_time}</div>
          </div>
          <div className={`${styles.pos} ${i === 0 ? styles.posNext : ''}`}>
            {i === 0 ? 'Next up' : `#${i + 1}`}
          </div>
        </div>
      ))}
    </div>
  );
}
