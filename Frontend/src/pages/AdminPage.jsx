import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAccessToken, getAccessToken, getUserRole, getDoctors, getAdminQueue, getAdminPatientLogs, callNextPatient, startSession, completeSession } from '../services/api';
import { supabase } from '../services/supabaseClient';
import QueueList from '../components/QueueList';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queue, setQueue] = useState([]);
  const [patientLogs, setPatientLogs] = useState([]);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [calledTicket, setCalledTicket] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [doctorAvailable, setDoctorAvailable] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyAdminSession = async () => {
      const token = getAccessToken();

      if (!token) {
        if (active) {
          setHasToken(false);
          setAuthChecked(true);
        }
        navigate('/admin/auth', { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      const role = data?.user?.user_metadata?.role || getUserRole();

      if (!active) return;

      if (error || !data?.user) {
        clearAccessToken();
        await supabase.auth.signOut({ scope: 'local' });
        setHasToken(false);
        setAuthChecked(true);
        navigate('/admin/auth', { replace: true });
        return;
      }

      if (role !== 'admin') {
        clearAccessToken();
        await supabase.auth.signOut({ scope: 'local' });
        setHasToken(false);
        setAuthChecked(true);
        navigate('/not-authorized', { replace: true });
        return;
      }

      setHasToken(true);
      setAuthChecked(true);
    };

    verifyAdminSession();

    const handleAuthChange = () => {
      const token = getAccessToken();
      const role = getUserRole();

      if (!token) {
        setHasToken(false);
        setAuthChecked(true);
        navigate('/admin/auth', { replace: true });
        return;
      }

      if (role !== 'admin') {
        setHasToken(false);
        setAuthChecked(true);
        navigate('/not-authorized', { replace: true });
      }
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      active = false;
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [navigate]);

  useEffect(() => {
    if (!hasToken) return;
    getDoctors()
      .then(setDoctors)
      .catch(() => setError('Failed to load doctors.'));
  }, [hasToken]);

  // loadQueue supports a silent option so realtime updates don't show a global loading overlay
  const loadQueue = useCallback(async (opts = { silent: false }) => {
    if (!selectedDoctorId) return;
    if (!opts.silent) setLoadingQueue(true);
    setError('');
    if (!opts.silent) setCalledTicket(null);
    try {
      const data = await getAdminQueue(selectedDoctorId);
      setQueue(data);
      setQueueLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!opts.silent) setLoadingQueue(false);
    }
  }, [selectedDoctorId]);

  const loadPatientLogs = useCallback(async (opts = { silent: false }) => {
    if (!selectedDoctorId) return;
    if (!opts.silent) setLoadingLogs(true);
    setError('');
    try {
      const data = await getAdminPatientLogs(selectedDoctorId);
      setPatientLogs(data);
      setLogsLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!opts.silent) setLoadingLogs(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    if (!selectedDoctorId || !hasToken) return;

    // initial fetch (show loading spinner)
    loadQueue();
    loadPatientLogs();

    // throttled/scheduled fetch helper so we don't hammer the API during bursts
    const scheduledRef = { timer: null, last: 0 };
    const scheduleFetch = () => {
      const now = Date.now();
      const elapsed = now - scheduledRef.last;
      const minInterval = 2000; // 2 seconds
      if (elapsed >= minInterval) {
        loadQueue({ silent: true });
        loadPatientLogs({ silent: true });
        scheduledRef.last = Date.now();
      } else {
        if (scheduledRef.timer) clearTimeout(scheduledRef.timer);
        scheduledRef.timer = setTimeout(() => {
          loadQueue({ silent: true });
          loadPatientLogs({ silent: true });
          scheduledRef.last = Date.now();
          scheduledRef.timer = null;
        }, minInterval - elapsed);
      }
    };

    // subscribe to Supabase realtime changes for this doctor's queue
    const channel = supabase
      .channel(`public:queues:doctor:${selectedDoctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queues', filter: `doctor_id=eq.${selectedDoctorId}` },
        (payload) => {
          // silent/throttled refresh — update state in background without showing global loading
          scheduleFetch();
        }
      )
      .subscribe();

    return () => {
      // cleanup subscription and any pending timer
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // fallback if removeChannel isn't available
        if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe();
      }
      if (scheduledRef.timer) clearTimeout(scheduledRef.timer);
    };
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

  const handleStartSession = async (queueId) => {
    try {
      setError('');
      await startSession(queueId);
      // refresh queue to reflect status change
      const data = await getAdminQueue(selectedDoctorId);
      setQueue(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteSession = async (queueId) => {
    try {
      setError('');
      await completeSession(queueId);
      // refresh queue to reflect status change
      const data = await getAdminQueue(selectedDoctorId);
      setQueue(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    clearAccessToken();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    navigate('/admin/auth', { replace: true });
  };

  return (
    <main className={styles.page}>
      {!authChecked ? null : null}
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
        <button className={styles.signOutBtn} onClick={handleSignOut}>
          Sign out
        </button>
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
              setLogsLoaded(false);
              setCalledTicket(null);
              setQueue([]);
              setPatientLogs([]);
            }}
          >
            <option value="">— Choose a doctor —</option>
            {doctors.map((doc) => (
              <option key={doc.doctor_id} value={doc.doctor_id}>
                Dr. {doc.doctor_name || `${doc.doctor_first_name || ''} ${doc.doctor_last_name || ''}`.trim()} — {doc.specialization || 'General'}
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
          ) : queue.length === 0 ? (
            <div className={styles.empty}>No patients in line</div>
          ) : (
            <QueueList 
              queue={queue}
              onStartSession={handleStartSession}
              onCompleteSession={handleCompleteSession}
            />
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
        {loadingLogs ? (
          <div className={styles.loadingQueue}>Loading patient logs…</div>
        ) : logsLoaded && patientLogs.length === 0 ? (
          <div className={styles.empty}>No served patients found for this doctor yet.</div>
        ) : logsLoaded ? (
          <div className={styles.logList}>
            {patientLogs.map((patient) => (
              <article key={patient.queue_id} className={styles.logCard}>
                <div className={styles.logTopRow}>
                  <div>
                    <div className={styles.logName}>{patient.patient_name}</div>
                    <div className={styles.logMeta}>Ticket #{patient.ticket_number}</div>
                  </div>
                  <div className={styles.logBadge}>{patient.status}</div>
                </div>
                <div className={styles.logTime}>Served at {patient.served_time}</div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.queueCount}>Select a doctor to view served patient logs.</p>
        )}
      </section>

      {notice && <p className={styles.error}>{notice}</p>}
      </>
      )}
    </main>
  );
}
