import React from 'react';
import styles from './DoctorCard.module.css';

export default function DoctorCard({ doctor, onClick }) {
  const available = doctor.is_available;

  return (
    <div
      className={`${styles.card} ${!available ? styles.unavailable : ''}`}
      onClick={() => available && onClick(doctor)}
    >
      <div className={styles.avatar}>🩺</div>
      <div className={styles.name}>Dr. {doctor.name}</div>
      <div className={styles.spec}>{doctor.specialization || 'General Practitioner'}</div>
      <div className={`${styles.status} ${available ? styles.availableStatus : styles.unavailableStatus}`}>
        {available ? 'Available' : 'Unavailable'}
      </div>
      {available && <div className={styles.joinHint}>Click to join queue →</div>}
    </div>
  );
}
