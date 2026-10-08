import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, money, when } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Empty, Field, Panel, control, statusTone } from '../components/ui';

function useLoader(path) {
  const { clinicId } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    api(path).then((next) => { if (active) setData(next); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [path, clinicId, tick]);
  return { data, error, reload: () => setTick((value) => value + 1) };
}

export function ClinicalPage() {
  const { clinicId } = useOutletContext();
  const { can, session } = useAuth();
  const patients = useLoader('/api/patients');
  const encounters = useLoader('/api/encounters');
  const [form, setForm] = useState({ patientId: '', subjective: '', objective: '', assessment: '', plan: '', diagnosis: '', symptoms: '', systolic: '', diastolic: '', pulse: '', spo2: '' });
  const [message, setMessage] = useState('');

  async function save(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/api/encounters', {
        method: 'POST',
        body: {
          ...form,
          clinicId,
          doctorId: session.user.roleKey === 'doctor' ? session.user.id : undefined,
          vitals: { systolic: form.systolic, diastolic: form.diastolic, pulse: form.pulse, spo2: form.spo2 }
        }
      });
      setMessage('Note saved.');
      encounters.reload();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="font-display text-4xl">Records</h1>
        <p className="mb-4 text-mute">SOAP notes, vitals, and the diagnosis for this visit.</p>
        {can('emr.write') && (
          <form className="space-y-3" onSubmit={save}>
            <Field label="Patient">
              <select className={control} required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
                <option value="">Choose</option>
                {patients.data?.patients?.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}
              </select>
            </Field>
            {['subjective', 'objective', 'assessment', 'plan', 'symptoms', 'diagnosis'].map((key) => (
              <Field key={key} label={key}><textarea className={control} rows={2} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></Field>
            ))}
            <div className="grid grid-cols-4 gap-2">
              {['systolic', 'diastolic', 'pulse', 'spo2'].map((key) => <input key={key} className={control} placeholder={key} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />)}
            </div>
            <Button type="submit">Save encounter</Button>
            {message && <p className="text-sm">{message}</p>}
          </form>
        )}
      </div>
      <div className="space-y-3">
        {encounters.data?.encounters?.map((note) => (
          <article key={note.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="font-medium">{note.first_name} {note.last_name}</div>
            <div className="text-sm text-mute">{when(note.created_at)} · {note.doctor_name}</div>
            <p className="mt-2 text-sm"><strong>S</strong> {note.subjective}</p>
            <p className="text-sm"><strong>A</strong> {note.assessment}</p>
            <p className="text-sm"><strong>P</strong> {note.plan}</p>
            <Badge tone="moss">{note.diagnosis || 'No diagnosis'}</Badge>
          </article>
        ))}
        {encounters.error && <p className="text-red-800">{encounters.error}</p>}
      </div>
    </div>
  );
}

export function DoctorsPage() {
  const { data, error } = useLoader('/api/staff');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (error) return <p className="text-red-800">{error}</p>;
  if (!data) return <p className="text-mute">Loading doctors…</p>;
  const doctors = data?.staff?.filter((person) => person.role_key === 'doctor') || [];
  return (
    <div>
      <h1 className="font-display mb-5 text-4xl">Doctors</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="rounded-3xl border border-line bg-white p-5">
            <div className="font-display text-2xl">{doctor.full_name}</div>
            <div className="text-mute">{doctor.specialization} · {doctor.qualifications}</div>
            <div className="mt-2 text-sm">License {doctor.license_number} · fee {money(doctor.consultation_fee)} · commission {doctor.commission_percent}%</div>
            <p className="mt-2 text-sm">{doctor.bio}</p>
            <div className="mt-3 text-sm">{data.schedules.filter((slot) => slot.user_id === doctor.id).map((slot) => `${days[slot.weekday]} ${slot.start_time.slice(0, 5)}`).join(' · ')}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function LabPage() {
  const { can } = useAuth();
  const orders = useLoader('/api/lab/orders');
  const tests = useLoader('/api/lab/tests');
  const patients = useLoader('/api/patients');
  const [order, setOrder] = useState(null);
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({ patientId: '', testIds: [] });

  async function create(event) {
    event.preventDefault();
    await api('/api/lab/orders', { method: 'POST', body: form });
    orders.reload();
  }

  async function saveResults(approve) {
    await api(`/api/lab/orders/${order.id}/results`, { method: 'POST', body: { items: results, approve } });
    setOrder(null);
    orders.reload();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Laboratory</h1>
      {can('lab.write') && (
        <form className="grid gap-3 rounded-3xl border border-line bg-white p-4 md:grid-cols-3" onSubmit={create}>
          <select className={control} required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
            <option value="">Patient</option>
            {patients.data?.patients?.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}
          </select>
          <select className={control} multiple value={form.testIds} onChange={(event) => setForm({ ...form, testIds: [...event.target.selectedOptions].map((option) => option.value) })}>
            {tests.data?.tests?.map((test) => <option key={test.id} value={test.id}>{test.name}</option>)}
          </select>
          <Button type="submit">Order tests</Button>
        </form>
      )}
      <div className="space-y-3">
        {orders.data?.orders?.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex justify-between"><strong>{item.first_name} {item.last_name}</strong><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>
            {item.items.map((test) => <div key={test.id} className="mt-1 text-sm">{test.name}: {test.resultValue || 'pending'} {test.flag ? `(${test.flag})` : ''} {test.refLow != null ? `ref ${test.refLow}–${test.refHigh}` : ''}</div>)}
            {can('lab.write') && <button className="mt-2 text-sm text-moss" type="button" onClick={() => { setOrder(item); setResults(item.items); }}>Enter results</button>}
          </article>
        ))}
      </div>
      {order && (
        <Panel title="Result entry">
          {results.map((item, index) => (
            <label key={item.id} className="mb-2 block text-sm">{item.name}
              <input className={`${control} mt-1`} value={item.resultValue || ''} onChange={(event) => setResults(results.map((row, rowIndex) => rowIndex === index ? { ...row, resultValue: event.target.value } : row))} />
            </label>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => saveResults(false)}>Save</Button>
            <Button tone="copper" onClick={() => saveResults(true)}>Approve</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function ImagingPage() {
  const { can } = useAuth();
  const orders = useLoader('/api/imaging');
  const patients = useLoader('/api/patients');
  const [form, setForm] = useState({ patientId: '', modality: 'ultrasound', studyName: '', clinicalInfo: '' });
  const [report, setReport] = useState({});

  async function create(event) {
    event.preventDefault();
    await api('/api/imaging', { method: 'POST', body: form });
    orders.reload();
  }

  async function save(id) {
    await api(`/api/imaging/${id}`, { method: 'PATCH', body: { report: report[id], status: 'approved' } });
    orders.reload();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Imaging</h1>
      <p className="text-sm text-mute">X-ray, ultrasound, CT, and MRI orders. A PACS or DICOMweb address can be attached in Settings; reports live here until that connector is on.</p>
      {can('imaging.write') && (
        <form className="grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-4" onSubmit={create}>
          <select className={control} required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
            <option value="">Patient</option>
            {patients.data?.patients?.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}
          </select>
          <select className={control} value={form.modality} onChange={(event) => setForm({ ...form, modality: event.target.value })}>
            {['xray', 'ultrasound', 'ct', 'mri'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className={control} placeholder="Study" required value={form.studyName} onChange={(event) => setForm({ ...form, studyName: event.target.value })} />
          <Button type="submit">Order</Button>
        </form>
      )}
      {orders.data?.orders?.map((item) => (
        <article key={item.id} className="rounded-3xl border border-line bg-white p-4">
          <div className="flex justify-between"><span>{item.modality.toUpperCase()} · {item.study_name} · {item.first_name} {item.last_name}</span><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>
          <p className="mt-2 text-sm">{item.report || item.clinical_info}</p>
          {can('imaging.write') && item.status !== 'approved' && (
            <div className="mt-2 flex gap-2">
              <input className={control} placeholder="Radiologist report" value={report[item.id] || ''} onChange={(event) => setReport({ ...report, [item.id]: event.target.value })} />
              <Button onClick={() => save(item.id)}>Approve</Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function PharmacyPage() {
  const meds = useLoader('/api/medicines');
  const patients = useLoader('/api/patients');
  const forecasts = useLoader('/api/ai/forecasts');
  const [lines, setLines] = useState([{ medicineId: '', quantity: 1 }]);
  const [patientId, setPatientId] = useState('');
  const [message, setMessage] = useState('');

  async function dispense(event) {
    event.preventDefault();
    try {
      const result = await api('/api/pharmacy/dispense', { method: 'POST', body: { patientId, lines } });
      setMessage(`Dispensed. Invoice ${result.invoice.number}.`);
      meds.reload();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Pharmacy</h1>
      <form className="rounded-3xl border border-line bg-white p-4" onSubmit={dispense}>
        <Field label="Patient">
          <select className={control} required value={patientId} onChange={(event) => setPatientId(event.target.value)}>
            <option value="">Choose</option>
            {patients.data?.patients?.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}
          </select>
        </Field>
        {lines.map((line, index) => (
          <div key={index} className="mt-2 grid grid-cols-[1fr_120px] gap-2">
            <select className={control} value={line.medicineId} onChange={(event) => setLines(lines.map((row, rowIndex) => rowIndex === index ? { ...row, medicineId: event.target.value } : row))}>
              <option value="">Medicine</option>
              {meds.data?.medicines?.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} · {medicine.on_hand} in stock</option>)}
            </select>
            <input className={control} type="number" min="1" value={line.quantity} onChange={(event) => setLines(lines.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Number(event.target.value) } : row))} />
          </div>
        ))}
        <div className="mt-3"><Button type="submit">Dispense and bill</Button></div>
        {message && <p className="mt-2 text-sm">{message}</p>}
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {meds.data?.medicines?.map((medicine) => (
          <div key={medicine.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex justify-between"><strong>{medicine.name}</strong><Badge tone={medicine.on_hand <= medicine.reorder_level ? 'red' : 'moss'}>{medicine.on_hand} {medicine.unit}</Badge></div>
            <div className="text-sm text-mute">{medicine.generic_name} · {medicine.strength} · {money(medicine.sell_price)}</div>
          </div>
        ))}
      </div>
      <Panel title="Stock forecast">
        <p className="mb-2 text-xs text-mute">{forecasts.data?.disclaimer}</p>
        {forecasts.data?.forecasts?.map((item) => <div key={item.name} className="text-sm">{item.name}: {item.daysOfCover == null ? 'not enough sales history' : `${item.daysOfCover} days of cover`}</div>)}
      </Panel>
    </div>
  );
}

export function BillingPage() {
  const { can } = useAuth();
  const invoices = useLoader('/api/invoices');
  const patients = useLoader('/api/patients');
  const [form, setForm] = useState({ patientId: '', category: 'consultation', description: 'Consultation', unitPrice: 3500 });
  const [pay, setPay] = useState({});

  async function create(event) {
    event.preventDefault();
    await api('/api/invoices', { method: 'POST', body: { patientId: form.patientId, category: form.category, lines: [{ description: form.description, quantity: 1, unitPrice: Number(form.unitPrice) }] } });
    invoices.reload();
  }

  async function takePayment(id) {
    await api(`/api/invoices/${id}/payments`, { method: 'POST', body: { amount: Number(pay[id]), method: 'cash' } });
    invoices.reload();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Billing</h1>
      {can('billing.write') && (
        <form className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-5" onSubmit={create}>
          <select className={control} value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
            <option value="">Patient</option>
            {patients.data?.patients?.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}
          </select>
          <select className={control} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {['consultation', 'lab', 'pharmacy', 'procedure', 'package', 'imaging'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className={control} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input className={control} type="number" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} />
          <Button type="submit">Issue</Button>
        </form>
      )}
      {invoices.data?.invoices?.map((invoice) => (
        <article key={invoice.id} className="rounded-3xl border border-line bg-white p-4">
          <div className="flex justify-between"><strong>{invoice.number}</strong><Badge tone={statusTone(invoice.status)}>{invoice.status}</Badge></div>
          <div className="text-sm text-mute">{invoice.first_name} {invoice.last_name} · {invoice.category} · {invoice.payer_type}</div>
          <div className="mt-1">{money(invoice.total)} · balance {money(invoice.balance)}</div>
          {can('billing.write') && invoice.balance > 0 && (
            <div className="mt-2 flex gap-2">
              <input className={control} placeholder="Amount" value={pay[invoice.id] || ''} onChange={(event) => setPay({ ...pay, [invoice.id]: event.target.value })} />
              <Button onClick={() => takePayment(invoice.id)}>Take cash</Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function InsurancePage() {
  const data = useLoader('/api/insurers');
  const [name, setName] = useState('');
  async function add(event) {
    event.preventDefault();
    await api('/api/insurers', { method: 'POST', body: { name } });
    setName('');
    data.reload();
  }
  async function setStatus(id, status) {
    await api(`/api/claims/${id}`, { method: 'PATCH', body: { status } });
    data.reload();
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Insurance</h1>
      <form className="flex gap-2" onSubmit={add}>
        <input className={control} placeholder="New insurer" value={name} onChange={(event) => setName(event.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {data.data?.plans?.map((plan) => <div key={plan.id} className="rounded-3xl bg-white p-4">{plan.insurer_name} · {plan.name} · {plan.coverage_percent}%</div>)}
      </div>
      {data.data?.claims?.map((claim) => (
        <article key={claim.id} className="rounded-3xl border border-line bg-white p-4">
          <div className="flex justify-between"><span>{claim.first_name} {claim.last_name} · {money(claim.amount)}</span><Badge tone={statusTone(claim.status)}>{claim.status}</Badge></div>
          <p className="text-sm text-mute">{claim.notes}</p>
          <div className="mt-2 flex gap-2">{['submitted', 'approved', 'rejected', 'paid'].map((status) => <button key={status} className="rounded-full bg-sand px-3 py-1 text-xs" type="button" onClick={() => setStatus(claim.id, status)}>{status}</button>)}</div>
        </article>
      ))}
    </div>
  );
}

export function InventoryPage() {
  const stock = useLoader('/api/stock');
  const orders = useLoader('/api/purchase-orders');
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Inventory</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {stock.data?.batches?.map((batch) => (
          <div key={batch.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="font-medium">{batch.medicine_name}</div>
            <div className="text-sm text-mute">{batch.clinic_name} · batch {batch.batch_no} · qty {batch.quantity}</div>
            <div className="text-sm">Expires {batch.expiry_on || '—'}</div>
          </div>
        ))}
      </div>
      <Panel title="Purchase orders">
        {orders.data?.orders?.map((order) => (
          <div key={order.id} className="flex items-center justify-between py-2 text-sm">
            <span>{order.supplier_name} · {order.status}</span>
            {order.status !== 'received' && <Button onClick={async () => { await api(`/api/purchase-orders/${order.id}/receive`, { method: 'POST', body: { expiryOn: '2027-12-31' } }); orders.reload(); stock.reload(); }}>Receive GRN</Button>}
          </div>
        ))}
      </Panel>
    </div>
  );
}

export function TeamPage() {
  const data = useLoader('/api/hr');
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Team</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {data.data?.staff?.map((person) => (
          <div key={person.id} className="rounded-3xl bg-white p-4">
            <div className="font-medium">{person.full_name}</div>
            <div className="text-sm text-mute">{person.role_name} · {person.clinic_name}</div>
            <button className="mt-2 text-sm text-moss" type="button" onClick={async () => { await api('/api/hr/attendance', { method: 'POST', body: { userId: person.id, status: 'present' } }); data.reload(); }}>Mark present</button>
          </div>
        ))}
      </div>
      <Panel title="Leave">
        {data.data?.leave?.map((item) => (
          <div key={item.id} className="flex justify-between py-2 text-sm">
            <span>{item.full_name} · {item.starts_on} to {item.ends_on}</span>
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
          </div>
        ))}
      </Panel>
    </div>
  );
}

export function TelemedPage() {
  const visits = useLoader('/api/appointments?date=');
  const tele = (visits.data?.appointments || []).filter((visit) => visit.visit_type === 'telemedicine');
  const [active, setActive] = useState(null);
  const [room, setRoom] = useState(null);
  const [text, setText] = useState('');

  async function open(id) {
    setActive(id);
    setRoom(await api(`/api/telemed/${id}`));
  }

  async function send(event) {
    event.preventDefault();
    await api(`/api/telemed/${active}/messages`, { method: 'POST', body: { body: text } });
    setText('');
    setRoom(await api(`/api/telemed/${active}`));
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Video visits</h1>
      <p className="max-w-2xl text-sm text-mute">The room opens on a public Jitsi meeting so a demo consult can actually start. That public room is not a covered clinical video service; swap the room URL for a provider with a business agreement before real patients use it.</p>
      {tele.map((visit) => (
        <button key={visit.id} className="block w-full rounded-3xl bg-white p-4 text-left" type="button" onClick={() => open(visit.id)}>
          {visit.first_name} {visit.last_name} · {when(visit.starts_at)}
        </button>
      ))}
      {!tele.length && <Empty>No telemedicine visits are booked.</Empty>}
      {room && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <iframe title="Video room" className="min-h-[420px] w-full rounded-3xl bg-ink" src={room.appointment.room_url} allow="camera; microphone; fullscreen" />
          <div className="rounded-3xl border border-line bg-white p-4">
            {room.messages.map((message) => <p key={message.id} className="mb-2 text-sm"><strong>{message.sender_name}: </strong>{message.body}</p>)}
            <form className="mt-3 flex gap-2" onSubmit={send}>
              <input className={control} value={text} onChange={(event) => setText(event.target.value)} placeholder="Message the room" />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function InboxPage() {
  const data = useLoader('/api/notifications');
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl">Inbox</h1>
        <Button tone="ghost" onClick={async () => { await api('/api/notifications/read', { method: 'POST' }); data.reload(); }}>Mark read</Button>
      </div>
      <p className="mb-4 text-sm text-mute">In-app messages are delivered now. SMS, email, and WhatsApp stay queued until a gateway is connected in Settings.</p>
      <div className="space-y-2">
        {data.data?.notifications?.map((item) => (
          <article key={item.id} className="rounded-3xl bg-white p-4">
            <div className="flex justify-between"><strong>{item.title}</strong><Badge tone={statusTone(item.status)}>{item.channel} · {item.status}</Badge></div>
            <p className="text-sm">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PeoplePage() {
  const data = useLoader('/api/users');
  const [form, setForm] = useState({ fullName: '', email: '', password: 'Linden#2026', roleId: '' });
  const [roleName, setRoleName] = useState('');
  const [message, setMessage] = useState('');

  async function create(event) {
    event.preventDefault();
    try {
      await api('/api/users', { method: 'POST', body: form });
      setMessage('Account created.');
      data.reload();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createRole(event) {
    event.preventDefault();
    await api('/api/roles', { method: 'POST', body: { name: roleName, permissions: ['patients.read', 'appointments.read'] } });
    setRoleName('');
    data.reload();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">People & roles</h1>
      <form className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-4" onSubmit={create}>
        <input className={control} placeholder="Name" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        <input className={control} placeholder="Email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <select className={control} required value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
          <option value="">Role</option>
          {data.data?.roles?.filter((role) => role.key !== 'super_admin').map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
        <Button type="submit">Invite</Button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            {data.data?.users?.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-4 py-3">{user.full_name}<div className="text-mute">{user.email}</div></td>
                <td>{user.role_name}</td>
                <td>{user.mfa_enabled ? 'MFA on' : 'MFA off'}</td>
                <td>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="flex gap-2" onSubmit={createRole}>
        <input className={control} placeholder="Custom role name" value={roleName} onChange={(event) => setRoleName(event.target.value)} />
        <Button type="submit">Create role</Button>
      </form>
    </div>
  );
}

export function FacilitiesPage() {
  const data = useLoader('/api/facilities');
  const [form, setForm] = useState({ name: '', code: '' });
  async function add(event) {
    event.preventDefault();
    await api('/api/clinics', { method: 'POST', body: form });
    data.reload();
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Facilities</h1>
      <form className="flex gap-2" onSubmit={add}>
        <input className={control} placeholder="New branch" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className={control} placeholder="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        <Button type="submit">Add branch</Button>
      </form>
      {data.data?.clinics?.map((clinic) => <div key={clinic.id} className="rounded-3xl bg-white p-4">{clinic.name} · {clinic.code} · {clinic.city}</div>)}
      <div className="grid gap-3 md:grid-cols-3">
        <Panel title="Departments">{data.data?.departments?.map((item) => <div key={item.id}>{item.name}</div>)}</Panel>
        <Panel title="Rooms">{data.data?.rooms?.map((item) => <div key={item.id}>{item.name} · {item.room_type}</div>)}</Panel>
        <Panel title="Beds">{data.data?.beds?.map((item) => <div key={item.id}>{item.ward_name} {item.label} · {item.status}</div>)}</Panel>
      </div>
    </div>
  );
}

export function AuditPage() {
  const data = useLoader('/api/audit');
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Audit</h1>
      <Panel title="Activity">
        {data.data?.activity?.map((item) => <div key={item.id} className="py-1 text-sm">{when(item.created_at)} · {item.full_name || 'System'} · {item.action}</div>)}
      </Panel>
      <Panel title="Sign-ins">
        {data.data?.logins?.map((item) => <div key={item.id} className="py-1 text-sm">{when(item.created_at)} · {item.email} · {item.success ? 'success' : item.failure_reason} · {item.ip}</div>)}
      </Panel>
      <Panel title="Sessions">
        {data.data?.sessions?.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>{item.full_name} · {item.ip || 'local'} · {item.revoked_at ? 'ended' : 'open'}</span>
            {!item.revoked_at && <button className="text-copper" type="button" onClick={async () => { await api(`/api/sessions/${item.id}`, { method: 'DELETE' }); data.reload(); }}>Revoke</button>}
          </div>
        ))}
      </Panel>
    </div>
  );
}

export function SettingsPage() {
  const { session, refresh } = useAuth();
  const plans = useLoader('/api/plans');
  const integrations = useLoader('/api/integrations');
  const [form, setForm] = useState({ name: session.organization?.name || '', phone: session.organization?.phone || '', primaryColor: session.organization?.primary_color || '#1c6b52' });
  const [message, setMessage] = useState('');

  async function save(event) {
    event.preventDefault();
    await api('/api/organization', { method: 'PATCH', body: form });
    await refresh();
    setMessage('Branding saved.');
  }

  async function changePlan(planKey) {
    const result = await api('/api/subscription', { method: 'POST', body: { planKey, billingCycle: 'monthly' } });
    setMessage(`Moved to ${result.plan.name}. Invoice ${result.invoice} recorded as paid in the demo ledger.`);
    await refresh();
  }

  async function backup() {
    const dump = await api('/api/backup');
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.organization.slug}-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Settings</h1>
      <form className="grid gap-3 rounded-3xl bg-white p-5 md:grid-cols-3" onSubmit={save}>
        <Field label="Name"><input className={control} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Phone"><input className={control} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Color"><input className={control} type="color" value={form.primaryColor} onChange={(event) => setForm({ ...form, primaryColor: event.target.value })} /></Field>
        <Button type="submit">Save branding</Button>
      </form>
      <Panel title="Subscription">
        <p className="mb-3 text-sm">Current plan: {session.subscription?.plan_name} · {session.subscription?.status}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {plans.data?.plans?.map((plan) => (
            <button key={plan.id} className="rounded-3xl border border-line p-4 text-left" type="button" onClick={() => changePlan(plan.key)}>
              <div className="font-display text-2xl">{plan.name}</div>
              <div>{money(plan.price_monthly)} / month</div>
              <div className="text-sm text-mute">{plan.max_branches ? `${plan.max_branches} branches` : 'Unlimited branches'} · {plan.max_users ? `${plan.max_users} users` : 'Unlimited users'}</div>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Connectors" action={<Button tone="ghost" onClick={backup}>Download backup</Button>}>
        {integrations.data?.integrations?.map((item) => (
          <div key={item.id} className="py-2 text-sm"><strong>{item.provider}</strong> · {item.category} · {item.enabled ? 'on' : 'waiting for credentials'}<div className="text-mute">{item.config?.note}</div></div>
        ))}
      </Panel>
      {message && <p>{message}</p>}
      <MfaCard />
    </div>
  );
}

function MfaCard() {
  const { session, refresh } = useAuth();
  const [setup, setSetup] = useState(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  async function begin() {
    setSetup(await api('/api/auth/mfa/setup', { method: 'POST' }));
  }
  async function enable(event) {
    event.preventDefault();
    try {
      await api('/api/auth/mfa/enable', { method: 'POST', body: { otp } });
      setMessage('MFA is on for the next sign-in.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }
  return (
    <Panel title="Two-factor authentication">
      <p className="text-sm text-mute">{session.user.mfaEnabled ? 'This account asks for a code at sign-in.' : 'Add a time-based code from an authenticator app.'}</p>
      {!session.user.mfaEnabled && <Button className="mt-3" tone="ghost" onClick={begin}>Set up</Button>}
      {setup && (
        <form className="mt-3 space-y-2" onSubmit={enable}>
          <p className="break-all text-sm">Secret: {setup.secret}</p>
          <input className={control} placeholder="6-digit code" value={otp} onChange={(event) => setOtp(event.target.value)} />
          <Button type="submit">Confirm code</Button>
        </form>
      )}
      {message && <p className="mt-2 text-sm">{message}</p>}
    </Panel>
  );
}

export function PlatformPage() {
  const data = useLoader('/api/platform/overview');
  if (data.error) return <p className="text-red-800">{data.error}</p>;
  if (!data.data) return <p className="text-mute">Loading the platform…</p>;
  const overview = data.data;
  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Tenants</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Tenants" value={overview.tenants.length} />
        <Stat label="Users" value={overview.totalUsers} />
        <Stat label="Patients" value={overview.totalPatients} />
        <Stat label="API events today" value={overview.apiCallsToday} />
      </div>
      <p className="text-sm text-mute">Database {overview.health.version} · storage {(overview.storageBytes / 1024 / 1024).toFixed(1)} MB · subscription cash {money(overview.subscriptionRevenue)}</p>
      {overview.tenants.map((tenant) => (
        <article key={tenant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4">
          <div>
            <div className="font-display text-2xl">{tenant.name}</div>
            <div className="text-sm text-mute">{tenant.slug} · {tenant.plan_name} · {tenant.clinics} branches · {tenant.patients} patients</div>
          </div>
          <div className="flex gap-2">
            <Badge tone={statusTone(tenant.status)}>{tenant.status}</Badge>
            <Button tone="ghost" onClick={async () => { await api(`/api/platform/tenants/${tenant.id}`, { method: 'PATCH', body: { status: tenant.status === 'suspended' ? 'active' : 'suspended' } }); data.reload(); }}>{tenant.status === 'suspended' ? 'Activate' : 'Suspend'}</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-3xl bg-white p-4"><div className="text-sm text-mute">{label}</div><div className="font-display text-3xl">{value}</div></div>;
}

export function PortalPage() {
  const { session } = useAuth();
  const appointments = useLoader('/api/appointments');
  const prescriptions = useLoader('/api/prescriptions');
  const labs = useLoader('/api/lab/orders');
  const invoices = useLoader('/api/invoices');
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Hello, {session.user.fullName.split(' ')[0]}.</h1>
      <Panel title="Visits">{appointments.data?.appointments?.map((visit) => <div key={visit.id} className="py-1">{when(visit.starts_at)} · {visit.doctor_name} · {visit.status}{visit.room_url ? ` · video ready` : ''}</div>)}</Panel>
      <Panel title="Prescriptions">{prescriptions.data?.prescriptions?.map((item) => <div key={item.id} className="py-1">{item.items.map((line) => line.medicineName).join(', ')}</div>)}</Panel>
      <Panel title="Lab reports">
        {labs.data?.orders?.map((order) => (
          <div key={order.id} className="py-2">
            {order.items.map((item) => <div key={item.id}>{item.name}: {item.resultValue || 'pending'} {item.flag || ''}</div>)}
          </div>
        ))}
        <button className="no-print mt-2 text-sm text-moss" type="button" onClick={() => window.print()}>Print report</button>
      </Panel>
      <Panel title="Invoices">
        {invoices.data?.invoices?.map((invoice) => <div key={invoice.id}>{invoice.number} · {money(invoice.balance)} due · {invoice.status}</div>)}
        <Link className="mt-2 inline-block text-sm text-moss" to="/app/billing">Payment details</Link>
      </Panel>
    </div>
  );
}
