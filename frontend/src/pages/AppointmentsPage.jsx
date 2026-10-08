import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, dayStamp, when } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Field, Modal, control, statusTone } from '../components/ui';

export default function AppointmentsPage() {
  const { clinicId } = useOutletContext();
  const { can } = useAuth();
  const [date, setDate] = useState(dayStamp());
  const [rows, setRows] = useState([]);
  const [queue, setQueue] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ patientId: '', doctorId: '', startsAt: '', visitType: 'in_person', reason: '', repeatCount: 1 });

  function load() {
    api(`/api/appointments?date=${date}`).then((data) => setRows(data.appointments)).catch((err) => setError(err.message));
    api('/api/appointments/queue').then((data) => setQueue(data.queue)).catch(() => {});
    api('/api/appointments/waiting-list').then((data) => setWaiting(data.waiting)).catch(() => {});
  }

  useEffect(() => { load(); }, [date, clinicId]);
  useEffect(() => {
    if (!can('patients.read')) return;
    api('/api/patients').then((data) => setPatients(data.patients)).catch(() => {});
    api('/api/staff').then((data) => setDoctors(data.staff.filter((person) => person.role_key === 'doctor'))).catch(() => {});
  }, [clinicId]);

  async function book(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/appointments', {
        method: 'POST',
        body: { ...form, clinicId, startsAt: new Date(`${form.startsAt}:00+05:00`).toISOString(), repeatEvery: 'week' }
      });
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function update(id, status) {
    await api(`/api/appointments/${id}`, { method: 'PATCH', body: { status } });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Appointments</h1>
          <p className="text-mute">Book, check in, and run the token queue.</p>
        </div>
        <div className="flex gap-2">
          <input className={control} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          {can('appointments.write') && <Button onClick={() => setOpen(true)}>Book</Button>}
        </div>
      </div>
      {error && <p className="text-sm text-red-800">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
        <div className="space-y-3">
          {rows.map((visit) => (
            <article key={visit.id} className="rounded-3xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{visit.first_name} {visit.last_name} <span className="text-mute">{visit.mrn}</span></div>
                  <div className="text-sm text-mute">{when(visit.starts_at)} · {visit.doctor_name || 'Unassigned'} · {visit.visit_type.replace('_', ' ')}</div>
                  <div className="text-sm">{visit.reason}</div>
                </div>
                <Badge tone={statusTone(visit.status)}>{visit.token_number ? `Token ${visit.token_number} · ` : ''}{visit.status.replaceAll('_', ' ')}</Badge>
              </div>
              {can('appointments.write') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {['confirmed', 'checked_in', 'in_consult', 'completed', 'no_show', 'cancelled'].map((status) => (
                    <button key={status} className="rounded-full bg-sand px-3 py-1 text-xs" type="button" onClick={() => update(visit.id, status)}>{status.replaceAll('_', ' ')}</button>
                  ))}
                </div>
              )}
            </article>
          ))}
          {!rows.length && <p className="text-mute">No visits on this date.</p>}
        </div>
        <div className="space-y-4">
          <section className="rounded-3xl bg-moss-deep p-4 text-sand">
            <h2 className="font-display text-2xl text-white">Queue</h2>
            {queue.map((item) => (
              <div key={item.id} className="mt-3 flex justify-between text-sm">
                <span>{item.token_number ? `#${item.token_number}` : '—'} {item.first_name}</span>
                <span>{item.queue_status}</span>
              </div>
            ))}
            {!queue.length && <p className="mt-2 text-sm text-sand/70">Nobody is waiting.</p>}
          </section>
          <section className="rounded-3xl border border-line bg-white p-4">
            <h2 className="font-display text-2xl">Waiting list</h2>
            {waiting.map((item) => <div key={item.id} className="mt-2 text-sm">{item.first_name} {item.last_name} · {item.notes}</div>)}
          </section>
        </div>
      </div>
      {open && (
        <Modal title="Book a visit" onClose={() => setOpen(false)}>
          <form className="grid gap-3" onSubmit={book}>
            <Field label="Patient">
              <select className={control} required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
                <option value="">Choose</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name} · {patient.mrn}</option>)}
              </select>
            </Field>
            <Field label="Doctor">
              <select className={control} value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value })}>
                <option value="">Unassigned</option>
                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>)}
              </select>
            </Field>
            <Field label="Starts (Karachi time)"><input className={control} type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></Field>
            <Field label="Type">
              <select className={control} value={form.visitType} onChange={(event) => setForm({ ...form, visitType: event.target.value })}>
                <option value="in_person">In person</option>
                <option value="walk_in">Walk-in</option>
                <option value="telemedicine">Telemedicine</option>
              </select>
            </Field>
            <Field label="Reason"><input className={control} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
            <Field label="Repeat weekly"><input className={control} type="number" min="1" max="8" value={form.repeatCount} onChange={(event) => setForm({ ...form, repeatCount: Number(event.target.value) })} /></Field>
            <Button type="submit">Save visit</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
