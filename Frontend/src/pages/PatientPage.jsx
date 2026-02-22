import React, { useState, useEffect, useCallback } from 'react';
import { getDoctors } from '../services/api';
import DoctorCard from '../components/DoctorCard';
import JoinQueueModal from '../components/JoinQueueModal';
import StatusChecker from '../components/StatusChecker';
import styles from './PatientPage.module.css';

export default function PatientPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      setError('Could not load doctors. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.tag}>Virtual Queue System</span>
        <h1 className={styles.title}>
          Skip the<br /><em>waiting room.</em>
        </h1>
        <p className={styles.sub}>
          Join a doctor's queue digitally and track your position in real time.
        </p>
      </section>

      {/* Doctors */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Doctors</h2>
          <button className={styles.refreshBtn} onClick={fetchDoctors} disabled={loading}>
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div className={styles.grid}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}

        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && (
          <div className={styles.grid}>
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onClick={setSelectedDoctor}
              />
            ))}
          </div>
        )}
      </section>

      {/* Status checker */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Check My Status</h2>
        </div>
        <StatusChecker />
      </section>

      {/* Modal */}
      {selectedDoctor && (
        <JoinQueueModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </main>
  );
}
