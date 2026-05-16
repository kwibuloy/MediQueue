import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAccessToken, getAccessToken, getUserRole, getDoctors, getAdminQueue, getAdminPatientLogs, callNextPatient, startSession, completeSession, inviteAdmin, getPendingInvitations, revokeInvitation, skipPatient, closeQueueForDoctor, setDoctorAvailability, createDoctor, removeDoctor } from '../services/api';
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteActionLoading, setInviteActionLoading] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [invitesLoaded, setInvitesLoaded] = useState(false);
  const [doctorAvailable, setDoctorAvailable] = useState(true);
  const [doctorForm, setDoctorForm] = useState({
    doctorFirstName: '',
    doctorLastName: '',
    specialization: '',
    roomNumber: '',
    isAvailable: true,
  });
  const [doctorCreateLoading, setDoctorCreateLoading] = useState(false);
  const [doctorRemoveLoading, setDoctorRemoveLoading] = useState(false);
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
      const role = getUserRole() || data?.user?.user_metadata?.role;

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

  const loadInvitations = useCallback(async () => {
    try {
      const data = await getPendingInvitations();
      setInvitations(data.invitations || []);
      setInvitesLoaded(true);
    } catch (err) {
      setNotice(err.message);
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    loadInvitations();
  }, [hasToken, loadInvitations]);

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
    const selected = doctors.find((d) => String(d.doctor_id) === String(selectedDoctorId));
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

  const handleToggleAvailability = async () => {
    if (!selectedDoctorId) return;

    try {
      setError('');
      setNotice('');
      const nextAvailability = !doctorAvailable;
      await setDoctorAvailability(selectedDoctorId, nextAvailability);
      setDoctorAvailable(nextAvailability);
      setDoctors((prev) =>
        prev.map((doc) =>
          String(doc.doctor_id) === String(selectedDoctorId)
            ? { ...doc, is_available: nextAvailability }
            : doc
        )
      );
      setNotice(`Doctor is now ${nextAvailability ? 'available' : 'unavailable'}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setInviteLoading(true);

    try {
      await inviteAdmin(inviteEmail);
      setNotice(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      await loadInvitations();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (email) => {
    setInviteActionLoading(email);
    setError('');
    setNotice('');

    try {
      await revokeInvitation(email);
      setNotice(`Invitation for ${email} cancelled.`);
      await loadInvitations();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviteActionLoading('');
    }
  };

  const handleDoctorFieldChange = (field, value) => {
    setDoctorForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setDoctorCreateLoading(true);

    try {
      const response = await createDoctor(doctorForm);
      const createdDoctor = response?.doctor;

      const refreshedDoctors = await getDoctors();
      setDoctors(refreshedDoctors);

      if (createdDoctor?.doctor_id) {
        setSelectedDoctorId(String(createdDoctor.doctor_id));
      }

      setDoctorForm({
        doctorFirstName: '',
        doctorLastName: '',
        specialization: '',
        roomNumber: '',
        isAvailable: true,
      });
      setNotice('Doctor added successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDoctorCreateLoading(false);
    }
  };

  const handleRemoveDoctor = async () => {
    if (!selectedDoctorId) return;

    const selectedDoctor = doctors.find((d) => String(d.doctor_id) === String(selectedDoctorId));
    const selectedDoctorName = selectedDoctor?.doctor_name || `${selectedDoctor?.doctor_first_name || ''} ${selectedDoctor?.doctor_last_name || ''}`.trim() || 'this doctor';
    const shouldRemove = window.confirm(`Remove Dr. ${selectedDoctorName}? This action cannot be undone.`);

    if (!shouldRemove) return;

    setDoctorRemoveLoading(true);
    setError('');
    setNotice('');

    try {
      await removeDoctor(selectedDoctorId);

      const refreshedDoctors = await getDoctors();
      setDoctors(refreshedDoctors);
      setSelectedDoctorId('');
      setQueueLoaded(false);
      setLogsLoaded(false);
      setQueue([]);
      setPatientLogs([]);
      setCalledTicket(null);
      setNotice('Doctor removed successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDoctorRemoveLoading(false);
    }
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
          <button
            className={styles.removeDoctorBtn}
            onClick={handleRemoveDoctor}
            disabled={!selectedDoctorId || doctorRemoveLoading}
          >
            {doctorRemoveLoading ? 'Removing…' : 'Remove Selected Doctor'}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Add Doctor</h2>
        <p className={styles.queueCount}>Fill in all required fields to create a doctor profile.</p>
        <form className={styles.doctorForm} onSubmit={handleCreateDoctor}>
          <div className={styles.doctorFormGrid}>
            <input
              className={styles.inviteInput}
              type="text"
              placeholder="First Name"
              value={doctorForm.doctorFirstName}
              onChange={(e) => handleDoctorFieldChange('doctorFirstName', e.target.value)}
              required
            />
            <input
              className={styles.inviteInput}
              type="text"
              placeholder="Last Name"
              value={doctorForm.doctorLastName}
              onChange={(e) => handleDoctorFieldChange('doctorLastName', e.target.value)}
              required
            />
            <input
              className={styles.inviteInput}
              type="text"
              placeholder="Specialization"
              value={doctorForm.specialization}
              onChange={(e) => handleDoctorFieldChange('specialization', e.target.value)}
              required
            />
            <input
              className={styles.inviteInput}
              type="text"
              placeholder="Room Number"
              value={doctorForm.roomNumber}
              onChange={(e) => handleDoctorFieldChange('roomNumber', e.target.value)}
              required
            />
          </div>
          <label className={styles.availabilityCheck}>
            <input
              type="checkbox"
              checked={doctorForm.isAvailable}
              onChange={(e) => handleDoctorFieldChange('isAvailable', e.target.checked)}
            />
            Available for queueing immediately
          </label>
          <button className={styles.inviteBtn} type="submit" disabled={doctorCreateLoading}>
            {doctorCreateLoading ? 'Adding…' : 'Add Doctor'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Invite Admin</h2>
        <p className={styles.queueCount}>Send an invitation to a clinician who should have admin access.</p>
        <form className={styles.inviteForm} onSubmit={handleInviteAdmin}>
          <input
            className={styles.inviteInput}
            type="email"
            placeholder="doctor@clinic.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <button className={styles.inviteBtn} type="submit" disabled={inviteLoading}>
            {inviteLoading ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
        {invitesLoaded && (
          <div className={styles.inviteList}>
            {invitations.length === 0 ? (
              <div className={styles.empty}>No pending admin invitations.</div>
            ) : (
              invitations.map((item) => (
                <div key={item.invitation_id} className={styles.inviteCard}>
                  <div>
                    <div className={styles.inviteEmail}>{item.email}</div>
                    <div className={styles.inviteMeta}>
                      Created {item.created_at ? new Date(item.created_at).toLocaleString() : 'recently'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.cancelInviteBtn}
                    onClick={() => handleCancelInvite(item.email)}
                    disabled={inviteActionLoading === item.email}
                  >
                    {inviteActionLoading === item.email ? 'Cancelling…' : 'Cancel Invite'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
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
              <button className={styles.loadBtn} onClick={async () => {
                try {
                  setNotice('');
                  setError('');
                  await skipPatient(selectedDoctorId);
                  setNotice('Patient skipped.');
                  await loadQueue();
                } catch (err) {
                  setError(err.message);
                }
              }}>Skip</button>
              <button className={styles.loadBtn} onClick={async () => {
                try {
                  setNotice('');
                  setError('');
                  const result = await closeQueueForDoctor(selectedDoctorId);
                  const removedCount = result?.removedCount ?? 0;
                  setNotice(`Queue closed. Removed ${removedCount} waiting patient${removedCount === 1 ? '' : 's'}.`);
                  await loadQueue();
                } catch (err) {
                  setError(err.message);
                }
              }}>Close Queue</button>
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
            onClick={handleToggleAvailability}
            disabled={!selectedDoctorId}
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
