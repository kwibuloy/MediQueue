import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { clearAccessToken, getAccessToken, getDoctors } from '../services/api';
import DoctorCard from '../components/DoctorCard';
import JoinQueueModal from '../components/JoinQueueModal';
import StatusChecker from '../components/StatusChecker';
import styles from './PatientPage.module.css';

export default function PatientPage() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const hasToken = !!getAccessToken();

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
  useEffect(() => {
    if (!hasToken) return;
    const interval = setInterval(fetchDoctors, 12000);
    return () => clearInterval(interval);
  }, [fetchDoctors, hasToken]);

  const filteredDoctors = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter((doc) => {
      const name = (doc.name || '').toLowerCase();
      const specialty = (doc.specialization || '').toLowerCase();
      const clinic = (doc.clinic || doc.clinic_name || 'main clinic').toLowerCase();
      return name.includes(term) || specialty.includes(term) || clinic.includes(term);
    });
  }, [doctors, query]);

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

      <section className={styles.section}>
        {!hasToken ? (
          <div className={styles.errorMsg}>
            Please log in first to access patient features. <Link to="/patient/auth">Go to login/register</Link>
          </div>
        ) : (
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Patient Dashboard</h2>
            <button
              className={styles.refreshBtn}
              onClick={() => {
                clearAccessToken();
                window.location.reload();
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </section>

      {hasToken && (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Find a Doctor</h2>
          <button className={styles.refreshBtn} onClick={fetchDoctors} disabled={loading}>
            ↻ Refresh
          </button>
        </div>
        <input
          className={styles.searchInput}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor, specialty, or clinic"
        />

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
            {filteredDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onClick={setSelectedDoctor}
              />
            ))}
          </div>
        )}
      </section>
      )}

      {hasToken && (
        <>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Queue Status</h2>
          </div>
          <StatusChecker />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Queue History</h2>
          <p className={styles.errorMsg}>
            Queue history endpoint is not available yet in the current backend. This section is ready for API integration.
          </p>
        </section>
        </>
      )}

      {selectedDoctor && (
        <JoinQueueModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </main>
  );
}
