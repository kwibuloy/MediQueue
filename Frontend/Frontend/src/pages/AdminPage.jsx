import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch(() => setError('Failed to load doctors.'));
  }, []);

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

  const handleCallNext = async () => {
    setCallingNext(true);
    setError('');
    try {
      const result = await callNextPatient(selectedDoctorId);
      setCalledTicket(result.data.ticket_number);
      // Refresh queue after calling
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
            </div>
          </div>

          {/* Called banner */}
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
    </main>
  );
}
