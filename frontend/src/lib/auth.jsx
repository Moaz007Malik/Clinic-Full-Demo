import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setClinicId, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinic] = useState('');

  async function refresh() {
    if (!getToken()) {
      setSession(null);
      setLoading(false);
      return;
    }
    try {
      const next = await api('/api/auth/me');
      setSession(next);
      const stored = localStorage.getItem('atrium_clinic');
      const fallback = next.clinics?.find((clinic) => clinic.id === next.user.clinicId)?.id
        || next.clinics?.find((clinic) => clinic.is_primary)?.id
        || next.clinics?.[0]?.id
        || '';
      const chosen = next.clinics?.some((clinic) => clinic.id === stored) ? stored : fallback;
      setClinic(chosen);
      setClinicId(chosen);
      const color = next.organization?.primary_color;
      const accent = next.organization?.accent_color;
      if (color) document.documentElement.style.setProperty('--color-moss', color);
      if (accent) document.documentElement.style.setProperty('--color-copper', accent);
    } catch {
      setToken(null);
      setSession(null);
      return false;
    } finally {
      setLoading(false);
    }
    return true;
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({
    session,
    loading,
    clinicId,
    refresh,
    async signIn(payload) {
      const result = await api('/api/auth/login', { method: 'POST', body: payload });
      setClinic('');
      setClinicId('');
      setToken(result.token);
      const opened = await refresh();
      if (!opened) throw new Error('This account could not be opened. Try again.');
    },
    async signOut() {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* already signed out */ }
      setToken(null);
      setSession(null);
    },
    chooseClinic(id) {
      setClinic(id);
      setClinicId(id);
    },
    can(permission) {
      if (!session) return false;
      if (session.user.isSuper || session.user.permissions.includes('*')) return true;
      return session.user.permissions.includes(permission);
    }
  }), [session, loading, clinicId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
