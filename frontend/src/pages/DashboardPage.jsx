import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import CountUp from '../bits/CountUp';
import SpotlightCard from '../bits/SpotlightCard';
import { AreaChart, BarList, ChartCard, ComboChart, DonutChart, PlatformCharts, dayParts, hourLabel, titleCase } from '../components/Charts';
import { api, money, when } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, statusTone } from '../components/ui';

export default function DashboardPage() {
  const { clinicId } = useOutletContext();
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const path = session.user.isSuper ? '/api/platform/overview' : '/api/dashboard';
    api(path).then(setData).catch((err) => setError(err.message));
  }, [clinicId, session.user.isSuper]);

  if (error) return <p className="text-red-800">{error}</p>;
  if (!data) return <p className="text-mute">Gathering today’s clinic…</p>;

  if (session.user.isSuper) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.2em] text-mute">PLATFORM</div>
            <h1 className="font-display text-4xl">Every clinic, one desk.</h1>
          </div>
          <Link className="rounded-full bg-moss px-4 py-2 text-white" to="/app/platform">Open tenants</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Groups', data.tenants.length],
            ['Users', data.totalUsers],
            ['Patients', data.totalPatients],
            ['Events today', data.apiCallsToday]
          ].map(([label, value]) => (
            <SpotlightCard key={label} theme="light" className="!rounded-3xl !p-5" spotlightColor="#1c6b52">
              <div className="text-sm text-mute">{label}</div>
              <CountUp to={Number(value) || 0} className="font-display mt-2 block text-4xl" duration={1.2} />
            </SpotlightCard>
          ))}
        </div>
        <PlatformCharts overview={data} />
      </div>
    );
  }

  const cards = [
    ['Patients', data.patients],
    ['Today’s visits', data.appointmentsToday],
    ['New this week', data.newPatients],
    ['Follow-ups due', data.followUps],
    ['Low stock', data.lowStock],
    ['Lab orders', data.labOrders],
    ['No-shows', data.noShows],
    ['In queue', data.inQueue],
    ['Open invoices', data.openInvoices],
    ['Claims waiting', data.claimsPending]
  ];
  const trend = (data.trend || []).map((point) => {
    const parts = dayParts(point.day);
    return { label: parts.full, short: parts.short, full: parts.full, bar: point.visits, line: point.revenue };
  });
  const hours = (data.hours || []).map((point) => {
    const label = hourLabel(point.hour);
    return { label: label.full, short: label.short, full: label.full, value: point.visits };
  });
  const freeBeds = Math.max(0, Number(data.bedsReady || 0) - Number(data.bedsOccupied || 0));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs tracking-[0.2em] text-mute">TODAY · MUSCAT</div>
        <h1 className="font-display text-4xl">Good day, {session.user.fullName.split(' ')[0]}.</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <SpotlightCard key={label} theme="light" className="!rounded-3xl !p-5" spotlightColor="#1c6b52">
            <div className="text-sm text-mute">{label}</div>
            <CountUp to={Number(value) || 0} className="font-display mt-2 block text-4xl" duration={1.2} />
          </SpotlightCard>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Today’s flow" note="Visits by hour · Muscat">
          <AreaChart points={hours} seriesName="Visits" />
        </ChartCard>
        <ChartCard title="Fortnight" note="Visits and collections">
          <ComboChart points={trend} barName="Visits" lineName="Collected" formatLine={money} />
        </ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Visit mix" note="Last 14 days">
          <DonutChart slices={data.statusMix || []} centerLabel="visits" />
        </ChartCard>
        <ChartCard title="Billed by service">
          <BarList rows={(data.categories || []).map((row) => ({ label: titleCase(row.label), value: row.amount }))} format={money} />
        </ChartCard>
        <ChartCard title="Doctors today">
          <BarList rows={(data.doctors || []).map((doctor) => ({ label: doctor.full_name, value: doctor.visits }))} format={(value) => `${value} booked`} />
        </ChartCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-line bg-white p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl">Schedule</h2>
            <div className="text-right">
              <div className="text-xs text-mute">Collected today</div>
              <div className="font-display text-2xl">{money(data.revenueToday)}</div>
            </div>
          </div>
          <div className="divide-y divide-line">
            {data.schedule.map((visit) => (
              <div key={visit.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
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
            <div className="font-display text-3xl text-white sm:text-4xl">{money(data.outstanding)}</div>
            <div className="mt-4 text-sm">Pharmacy today {money(data.pharmacySales)}</div>
            <div className="mt-2 text-sm">Beds in use {data.bedsOccupied || 0} of {data.bedsReady || 0}</div>
          </section>
          <section className="rounded-3xl border border-line bg-white p-5">
            <h2 className="font-display mb-3 text-xl">Beds</h2>
            <DonutChart
              slices={[
                { label: 'Occupied', value: data.bedsOccupied || 0 },
                { label: 'Free', value: freeBeds }
              ]}
              centerLabel="beds"
            />
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
