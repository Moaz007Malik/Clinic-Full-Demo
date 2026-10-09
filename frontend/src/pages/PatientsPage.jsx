import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button, Empty, Field, Modal, control } from '../components/ui';

export default function PatientsPage() {
  const { clinicId } = useOutletContext();
  const { can, session, organizationId } = useAuth();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', sex: 'female', phone: '', dob: '', bloodGroup: '' });

  function load() {
    const params = new URLSearchParams();
    if (session.user.isSuper) params.set('organizationId', session.organization?.id || '');
    if (query) params.set('q', query);
    api(`/api/patients?${params}`).then((data) => setPatients(data.patients)).catch((err) => setError(err.message));
  }

  useEffect(() => { load(); }, [clinicId, query, organizationId]);

  async function create(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/patients', { method: 'POST', body: { ...form, clinicId } });
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Patients</h1>
          <p className="text-mute">Charts stay inside this organization. Search by name, MRN, or phone.</p>
        </div>
        {can('patients.write') && <Button onClick={() => setOpen(true)}>Register patient</Button>}
      </div>
      <input className={`${control} mb-4 max-w-md`} placeholder="Search the registry" value={query} onChange={(event) => setQuery(event.target.value)} />
      {error && <p className="mb-3 text-sm text-red-800">{error}</p>}
      {!patients.length ? <Empty>No patients match.</Empty> : (
        <div className="overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-sand text-mute">
              <tr><th className="px-4 py-3">Patient</th><th>MRN</th><th>Phone</th><th>City</th><th></th></tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                    <div className="text-mute">{patient.sex} · {patient.blood_group || 'blood group unknown'}</div>
                  </td>
                  <td>{patient.mrn}</td>
                  <td>{patient.phone || '—'}</td>
                  <td>{patient.city || '—'}</td>
                  <td className="px-4 py-3 text-right"><Link className="text-moss" to={`/app/patients/${patient.id}`}>Open chart</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title="New patient" onClose={() => setOpen(false)}>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={create}>
            <Field label="First name"><input className={control} required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
            <Field label="Last name"><input className={control} required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
            <Field label="Date of birth"><input className={control} type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} /></Field>
            <Field label="Sex">
              <select className={control} value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}>
                <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="Phone"><input className={control} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Blood group"><input className={control} value={form.bloodGroup} onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit">Save chart</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
