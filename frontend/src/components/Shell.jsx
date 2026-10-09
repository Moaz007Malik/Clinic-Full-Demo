import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';

const NAV = [
  ['Overview', '/app', 'reports.read'],
  ['Patients', '/app/patients', 'patients.read'],
  ['Appointments', '/app/appointments', 'appointments.read'],
  ['Records', '/app/records', 'emr.read'],
  ['Doctors', '/app/doctors', 'appointments.read'],
  ['Laboratory', '/app/lab', 'lab.read'],
  ['Imaging', '/app/imaging', 'imaging.read'],
  ['Pharmacy', '/app/pharmacy', 'pharmacy.read'],
  ['Billing', '/app/billing', 'billing.read'],
  ['Insurance', '/app/insurance', 'insurance.read'],
  ['Inventory', '/app/inventory', 'inventory.read'],
  ['Team', '/app/team', 'hr.read'],
  ['Video visits', '/app/telemed', 'telemed.join'],
  ['Inbox', '/app/inbox', 'notifications.read'],
  ['People', '/app/people', 'users.manage'],
  ['Facilities', '/app/facilities', 'clinics.manage'],
  ['Audit', '/app/audit', 'audit.read'],
  ['Settings', '/app/settings', 'settings.manage'],
  ['Tenants', '/app/platform', 'platform.health']
];

export default function Shell() {
  const { session, signOut, clinicId, chooseClinic, organizationId, tenants, chooseOrganization, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session.user;
  const items = user.roleKey === 'patient'
    ? [['My care', '/app/portal', 'portal.access'], ['Inbox', '/app/inbox', 'notifications.read']]
    : NAV.filter((item) => can(item[2]) && !(user.roleKey === 'patient' && item[0] === 'Doctors'));

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="app-shell flex h-dvh overflow-hidden">
      {menuOpen && (
        <button type="button" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col bg-moss-deep text-sand transition-transform duration-200 lg:static lg:z-auto lg:h-dvh lg:w-[250px] lg:shrink-0 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between gap-3 px-5 py-6">
          <div className="min-w-0">
            <div className="text-xs tracking-[0.22em] text-sand/60">LINDEN</div>
            <div className="font-display truncate text-2xl text-white">{session.organization?.name || (user.isSuper ? 'Platform' : 'Linden')}</div>
          </div>
          <button type="button" className="rounded-full px-2 py-1 text-sm text-sand/80 lg:hidden" onClick={() => setMenuOpen(false)}>Close</button>
        </div>
        <nav className="nav-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => `block whitespace-nowrap rounded-full px-3 py-2 text-sm ${isActive ? 'bg-white text-ink' : 'text-sand/80 hover:bg-white/10'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 px-5 py-5 text-sm text-sand/70">
          <div className="truncate text-white">{user.fullName}</div>
          <div className="truncate">{user.roleName}</div>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex shrink-0 items-center gap-2 border-b border-line bg-paper/90 px-3 py-3 backdrop-blur sm:px-4 md:px-8">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <span className="flex w-4 flex-col gap-1">
              <span className="h-0.5 rounded bg-ink" />
              <span className="h-0.5 rounded bg-ink" />
              <span className="h-0.5 rounded bg-ink" />
            </span>
          </button>
          <div className="min-w-0 flex-1 truncate text-sm text-mute">{session.organization ? `${session.organization.city || ''} · ${session.organization.slug}` : 'Every clinic, one ledger'}</div>
          <div className="flex shrink-0 items-center gap-2">
            {user.isSuper && (
              <select className="max-w-32 truncate rounded-full border border-line bg-white px-2 py-2 text-sm sm:max-w-xs sm:px-3" aria-label="Organization" value={organizationId} onChange={(event) => chooseOrganization(event.target.value)}>
                {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </select>
            )}
            {session.clinics?.length > 1 && (
              <select className="max-w-28 truncate rounded-full border border-line bg-white px-2 py-2 text-sm sm:max-w-xs sm:px-3" value={clinicId} onChange={(event) => chooseClinic(event.target.value)}>
                {session.clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
              </select>
            )}
            <button className="rounded-full border border-line bg-white px-3 py-2 text-sm" type="button" onClick={async () => { await signOut(); navigate('/'); }}>Sign out</button>
          </div>
        </header>
        <motion.main key={user.id} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Outlet context={{ clinicId }} />
        </motion.main>
      </div>
    </div>
  );
}
