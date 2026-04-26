const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ACCESS_TOKEN_KEY = 'access_token';
const USER_ROLE_KEY = 'user_role';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getUserRole = () => localStorage.getItem(USER_ROLE_KEY);
export const setAccessToken = (token) => {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
};
const setUserRole = (role) => {
  if (role) localStorage.setItem(USER_ROLE_KEY, role);
};
export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
};

async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Non-JSON response from API for ${path}. Check API base URL and endpoint.`);
  }
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const getDoctors = () => apiFetch('/doctors');

export const login = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const token = data?.session?.access_token;
  const role = data?.session?.user?.user_metadata?.role;
  setAccessToken(token);
  setUserRole(role);
  return data;
};

export const register = (fullName, email, password, role = 'patient') =>
  apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, role }),
  });

export const joinQueue = (doctorId) =>
  apiFetch('/queue/join', {
    method: 'POST',
    body: JSON.stringify({ doctorId }),
  });

export const getAdminQueue = (doctorId) =>
  apiFetch(`/queue/admin/${doctorId}`);

export const callNextPatient = (doctorId) =>
  apiFetch(`/admin/call-next/${doctorId}`, { method: 'PATCH' });

export const getPatientStatus = () =>
  apiFetch('/queue/patient-status');
