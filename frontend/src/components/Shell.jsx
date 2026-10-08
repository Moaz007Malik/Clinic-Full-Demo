import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  const { session, signOut, clinicId, chooseClinic, can } = useAuth();
  const navigate = useNavigate();
  const user = session.user;
  const items = user.roleKey === 'patient'
    ? [['My care', '/app/portal', 'portal.access'], ['Inbox', '/app/inbox', 'notifications.read']]
    : NAV.filter((item) => can(item[2]) && !(user.roleKey === 'patient' && item[0] === 'Doctors'));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="flex flex-col bg-moss-deep text-sand lg:min-h-screen">
        <div className="px-5 py-6">
          <div className="text-xs tracking-[0.22em] text-sand/60">LINDEN</div>
          <div className="font-display text-2xl text-white">{session.organization?.name || 'Platform'}</div>
        </div>
        <nav className="flex gap-2 overflow-auto px-3 pb-4 lg:block lg:flex-1 lg:space-y-1 lg:overflow-visible">
          {items.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => `block whitespace-nowrap rounded-full px-3 py-2 text-sm ${isActive ? 'bg-white text-ink' : 'text-sand/80 hover:bg-white/10'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-5 py-5 text-sm text-sand/70 lg:block">
          <div className="text-white">{user.fullName}</div>
          <div>{user.roleName}</div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="text-sm text-mute">{session.organization ? `${session.organization.city || ''} · ${session.organization.slug}` : 'Every clinic, one ledger'}</div>
          <div className="flex items-center gap-2">
            {session.clinics?.length > 1 && (
              <select className="rounded-full border border-line bg-white px-3 py-2 text-sm" value={clinicId} onChange={(event) => chooseClinic(event.target.value)}>
                {session.clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
              </select>
            )}
            <button className="rounded-full border border-line bg-white px-3 py-2 text-sm" type="button" onClick={async () => { await signOut(); navigate('/'); }}>Sign out</button>
          </div>
        </header>
        <motion.main key={user.id} className="px-4 py-6 md:px-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Outlet context={{ clinicId }} />
        </motion.main>
      </div>
    </div>
  );
}
