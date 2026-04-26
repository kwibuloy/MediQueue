import React from 'react';
import styles from './DoctorCard.module.css';

export default function DoctorCard({ doctor, onClick }) {
  const available = doctor.is_available;
  const queueLength = doctor.current_queue_length ?? doctor.queue_length ?? null;
  const estimatedWait = doctor.estimated_wait_minutes ?? null;
  const clinicName = doctor.clinic || doctor.clinic_name || 'Main Clinic';

  return (
    <div
      className={`${styles.card} ${!available ? styles.unavailable : ''}`}
      onClick={() => available && onClick(doctor)}
    >
      <div className={styles.avatar}>🩺</div>
      <div className={styles.name}>Dr. {doctor.name}</div>
      <div className={styles.spec}>{doctor.specialization || 'General Practitioner'}</div>
      <div className={styles.meta}>Clinic: {clinicName}</div>
      <div className={styles.meta}>
        Queue: {queueLength === null ? 'Unavailable' : `${queueLength} waiting`}
      </div>
      <div className={styles.meta}>
        Est. wait: {estimatedWait === null ? 'Unavailable' : `${estimatedWait} mins`}
      </div>
      <div className={`${styles.status} ${available ? styles.availableStatus : styles.unavailableStatus}`}>
        {available ? 'Available' : 'Unavailable'}
      </div>
      {available && <div className={styles.joinHint}>Click to join queue →</div>}
    </div>
  );
}
