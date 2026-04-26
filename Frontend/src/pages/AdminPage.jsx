import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDoctors, getAdminQueue, callNextPatient } from '../services/api';
import QueueList from '../components/QueueList';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queue, setQueue] = useState([]);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [calledTicket, setCalledTicket] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [doctorAvailable, setDoctorAvailable] = useState(true);
  const hasToken = !!localStorage.getItem('access_token');

  useEffect(() => {
    if (!hasToken) return;
    getDoctors()
      .then(setDoctors)
      .catch(() => setError('Failed to load doctors.'));
  }, [hasToken]);

  const loadQueue = useCallback(async () => {
    if (!selectedDoctorId) return;
    setLoadingQueue(true);
    setError('');
    setCalledTicket(null);
    try {
      const data = await getAdminQueue(selectedDoctorId);
      setQueue(data);
      setQueueLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    if (!selectedDoctorId || !hasToken) return;
    loadQueue();
    const interval = setInterval(loadQueue, 7000);
    return () => clearInterval(interval);
  }, [hasToken, loadQueue, selectedDoctorId]);

  useEffect(() => {
    const selected = doctors.find((d) => String(d.id) === String(selectedDoctorId));
    if (selected) setDoctorAvailable(!!selected.is_available);
  }, [selectedDoctorId, doctors]);

  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      setError('');
      const result = await callNextPatient(selectedDoctorId);
      setCalledTicket(result.data.ticket_number);
      const data = await getAdminQueue(selectedDoctorId);
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <main className={styles.page}>
      {!hasToken && (
        <section className={styles.section}>
          <p className={styles.error}>Please log in as admin first. <Link to="/admin/auth">Go to admin login</Link></p>
        </section>
      )}

      {hasToken && (
      <>
      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.tag}>Admin Dashboard</span>
        <h1 className={styles.title}>
          Queue<br /><em>Control.</em>
        </h1>
      </section>

      {/* Doctor select */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Select Doctor</h2>
        <div className={styles.selectRow}>
          <select
            className={styles.select}
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setQueueLoaded(false);
              setCalledTicket(null);
              setQueue([]);
            }}
          >
            <option value="">— Choose a doctor —</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.name} — {doc.specialization || 'General'}
              </option>
            ))}
          </select>
          <button
            className={styles.loadBtn}
            onClick={loadQueue}
            disabled={!selectedDoctorId || loadingQueue}
          >
            {loadingQueue ? 'Loading…' : 'Load Queue'}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      {/* Queue section */}
      {queueLoaded && (
        <section className={styles.section}>
          <div className={styles.queueHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Waiting Queue</h2>
              <p className={styles.queueCount}>
                {queue.length} patient{queue.length !== 1 ? 's' : ''} waiting
              </p>
            </div>
            <div className={styles.queueActions}>
              <button
                className={styles.refreshSmall}
                onClick={loadQueue}
                disabled={loadingQueue}
              >
                ↻
              </button>
              <button
                className={styles.callBtn}
                onClick={handleCallNext}
                disabled={callingNext || queue.length === 0}
              >
                {callingNext ? 'Calling…' : '✚ Call Next'}
              </button>
              <button className={styles.loadBtn} onClick={() => setNotice('Mark served action needs backend endpoint.')}>Mark Served</button>
              <button className={styles.loadBtn} onClick={() => setNotice('Skip action needs backend endpoint.')}>Skip</button>
              <button className={styles.loadBtn} onClick={() => setNotice('Close queue action needs backend endpoint.')}>Close Queue</button>
            </div>
          </div>

          {/* Called notif */}
          {calledTicket && (
            <div className={styles.calledBanner}>
              <span className={styles.bellIcon}>🔔</span>
              <div>
                <span className={styles.calledLabel}>Now Calling</span>
                <span className={styles.calledNum}>Ticket #{calledTicket}</span>
              </div>
            </div>
          )}

          {loadingQueue ? (
            <div className={styles.loadingQueue}>Loading queue…</div>
          ) : (
            <QueueList queue={queue} />
          )}
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Analytics</h2>
        <p className={styles.queueCount}>Derived from currently available queue data.</p>
        <div className={styles.selectRow}>
          <div className={styles.select}>Patients waiting now: {queue.length}</div>
          <div className={styles.select}>Average wait: ~{Math.max((queue.length - 1) * 10, 0)} mins</div>
          <div className={styles.select}>Peak hours: Requires historical queue API</div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Availability</h2>
        <div className={styles.selectRow}>
          <button
            className={styles.callBtn}
            onClick={() => setNotice('Doctor availability update endpoint not available yet.')}
          >
            Set as {doctorAvailable ? 'Unavailable' : 'Available'}
          </button>
          <p className={styles.queueCount}>Current status: {doctorAvailable ? 'Available' : 'Unavailable'}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Patient Logs</h2>
        <p className={styles.queueCount}>
          Patient history log for this doctor is ready in UI but requires backend log/history endpoint.
        </p>
      </section>

      {notice && <p className={styles.error}>{notice}</p>}
      </>
      )}
    </main>
  );
}
