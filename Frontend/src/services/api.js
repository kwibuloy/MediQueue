const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const getDoctors = () => apiFetch('/doctors');

export const joinQueue = (patientId, doctorId) =>
  apiFetch('/queue/join', {
    method: 'POST',
    body: JSON.stringify({ patientId, doctorId }),
  });

export const getAdminQueue = (doctorId) =>
  apiFetch(`/queue/admin/${doctorId}`);

export const callNextPatient = (doctorId) =>
  apiFetch(`/admin/call-next/${doctorId}`, { method: 'PATCH' });

export const getPatientStatus = (patientId) =>
  apiFetch(`/queue/patient-status/${encodeURIComponent(patientId)}`);
