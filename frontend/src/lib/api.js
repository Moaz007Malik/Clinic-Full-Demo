const TOKEN_KEY = 'atrium_token';
const CLINIC_KEY = 'atrium_clinic';
const ORG_KEY = 'atrium_org';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getClinicId() {
  return localStorage.getItem(CLINIC_KEY) || '';
}

export function setClinicId(id) {
  if (id) localStorage.setItem(CLINIC_KEY, id);
  else localStorage.removeItem(CLINIC_KEY);
}

export function getOrganizationId() {
  return localStorage.getItem(ORG_KEY) || '';
}

export function setOrganizationId(id) {
  if (id) localStorage.setItem(ORG_KEY, id);
  else localStorage.removeItem(ORG_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const clinicId = getClinicId();
  if (clinicId && !path.startsWith('/api/auth/')) headers['X-Clinic-Id'] = clinicId;
  const organizationId = getOrganizationId();
  if (organizationId && !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/onboard')) {
    headers['X-Organization-Id'] = organizationId;
  }
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.mfaRequired = Boolean(data.mfaRequired);
    throw error;
  }
  return data;
}

export function money(value) {
  return new Intl.NumberFormat('en-OM', { style: 'currency', currency: 'OMR' }).format(Number(value || 0));
}

export function when(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-OM', {
    timeZone: 'Asia/Muscat',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function dayStamp(offset = 0) {
  const date = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function fullName(person) {
  if (!person) return '';
  return person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' ');
}
