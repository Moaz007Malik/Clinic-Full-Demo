import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import CountUp from '../bits/CountUp';
import SpotlightCard from '../bits/SpotlightCard';
import { api, money, when } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, statusTone } from '../components/ui';

export default function DashboardPage() {
  const { clinicId } = useOutletContext();
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session.user.isSuper) return;
    api('/api/dashboard').then(setData).catch((err) => setError(err.message));
  }, [clinicId, session.user.isSuper]);

  if (session.user.isSuper) {
    return (
      <div>
        <h1 className="font-display text-4xl">Platform view</h1>
        <p className="mt-2 text-mute">Tenant totals, subscription state, and system health live on the tenants desk.</p>
        <Link className="mt-6 inline-flex rounded-full bg-moss px-4 py-2 text-white" to="/app/platform">Open tenants</Link>
      </div>
    );
  }

  if (error) return <p className="text-red-800">{error}</p>;
  if (!data) return <p className="text-mute">Gathering today’s clinic…</p>;

  const cards = [
    ['Patients', data.patients],
    ['Today’s visits', data.appointmentsToday],
    ['New this week', data.newPatients],
    ['Follow-ups due', data.followUps],
    ['Low stock', data.lowStock],
    ['Lab orders', data.labOrders]
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs tracking-[0.2em] text-mute">TODAY</div>
        <h1 className="font-display text-4xl">Good day, {session.user.fullName.split(' ')[0]}.</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <SpotlightCard key={label} theme="light" className="!rounded-3xl !p-5" spotlightColor="#1c6b52">
            <div className="text-sm text-mute">{label}</div>
            <CountUp to={Number(value) || 0} className="font-display mt-2 block text-4xl" duration={1.2} />
          </SpotlightCard>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-line bg-white p-5">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl">Schedule</h2>
            <div className="text-right">
              <div className="text-xs text-mute">Collected today</div>
              <div className="font-display text-2xl">{money(data.revenueToday)}</div>
            </div>
          </div>
          <div className="divide-y divide-line">
            {data.schedule.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium">{visit.first_name} {visit.last_name}</div>
                  <div className="text-sm text-mute">{when(visit.starts_at)} · {visit.doctor_name} · {visit.reason}</div>
                </div>
                <Badge tone={statusTone(visit.status)}>{visit.token_number ? `#${visit.token_number} ` : ''}{visit.status.replace('_', ' ')}</Badge>
              </div>
            ))}
            {!data.schedule.length && <p className="text-mute">No visits on the selected branch today.</p>}
          </div>
        </section>
        <div className="space-y-4">
          <section className="rounded-3xl bg-moss-deep p-5 text-sand">
            <div className="text-sm text-sand/70">Outstanding</div>
            <div className="font-display text-4xl text-white">{money(data.outstanding)}</div>
            <div className="mt-4 text-sm">Pharmacy today {money(data.pharmacySales)}</div>
          </section>
          <section className="rounded-3xl border border-line bg-white p-5">
            <h2 className="font-display text-xl">Doctors</h2>
            {data.doctors.map((doctor) => (
              <div key={doctor.full_name} className="mt-3 flex justify-between text-sm">
                <span>{doctor.full_name}</span>
                <span className="text-mute">{doctor.completed}/{doctor.visits} seen</span>
              </div>
            ))}
            <h2 className="font-display mt-6 text-xl">Expiring stock</h2>
            {data.expiring.map((batch) => (
              <div key={batch.batch_no} className="mt-2 text-sm">{batch.name} · {batch.batch_no} · {batch.expiry_on}</div>
            ))}
            {!data.expiring.length && <p className="mt-2 text-sm text-mute">Nothing expires in the next 90 days.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
