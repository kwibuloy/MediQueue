import React, { memo } from 'react';
import styles from './DoctorCard.module.css';

function DoctorCard({ doctor, onClick }) {
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
      <div className={styles.name}>Dr. {doctor.doctor_name || `${doctor.doctor_first_name || ''} ${doctor.doctor_last_name || ''}`.trim() || doctor.name}</div>
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

function doctorDisplayKey(d) {
  return d.doctor_id ?? d.id;
}

function areDoctorPropsEqual(prev, next) {
  if (prev.onClick !== next.onClick) return false;
  const a = prev.doctor;
  const b = next.doctor;
  if (doctorDisplayKey(a) !== doctorDisplayKey(b)) return false;
  if (!!a.is_available !== !!b.is_available) return false;
  if ((a.current_queue_length ?? a.queue_length) !== (b.current_queue_length ?? b.queue_length)) {
    return false;
  }
  if ((a.estimated_wait_minutes ?? null) !== (b.estimated_wait_minutes ?? null)) return false;
  const nameA = a.doctor_name || `${a.doctor_first_name || ''} ${a.doctor_last_name || ''}`.trim() || a.name;
  const nameB = b.doctor_name || `${b.doctor_first_name || ''} ${b.doctor_last_name || ''}`.trim() || b.name;
  if (nameA !== nameB) return false;
  if ((a.specialization || '') !== (b.specialization || '')) return false;
  const clinicA = a.clinic || a.clinic_name || '';
  const clinicB = b.clinic || b.clinic_name || '';
  if (clinicA !== clinicB) return false;
  return true;
}

export default memo(DoctorCard, areDoctorPropsEqual);
