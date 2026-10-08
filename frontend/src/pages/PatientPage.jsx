import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, when } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Field, Panel, control, statusTone } from '../components/ui';

export default function PatientPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');
  const [allergy, setAllergy] = useState({ substance: '', reaction: '', severity: 'moderate' });

  function load() {
    Promise.all([api(`/api/patients/${id}`), api(`/api/patients/${id}/timeline`)])
      .then(([chart, timeline]) => { setData(chart); setEvents(timeline.events); })
      .catch((err) => setError(err.message));
  }

  useEffect(() => { load(); }, [id]);

  async function addAllergy(event) {
    event.preventDefault();
    await api(`/api/patients/${id}/allergies`, { method: 'POST', body: allergy });
    setAllergy({ substance: '', reaction: '', severity: 'moderate' });
    load();
  }

  async function loadBrief() {
    setBrief(await api(`/api/ai/brief/${id}`));
  }

  if (error) return <p className="text-red-800">{error}</p>;
  if (!data) return <p className="text-mute">Opening the chart…</p>;
  const patient = data.patient;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.18em] text-mute">{patient.mrn}</div>
          <h1 className="font-display text-4xl">{patient.first_name} {patient.last_name}</h1>
          <p className="text-mute">{patient.sex || '—'} · {patient.blood_group || 'blood group unknown'} · {patient.phone || 'no phone'} · {patient.city || ''}</p>
        </div>
        {can('ai.use') && <Button tone="ghost" onClick={loadBrief}>Chart brief</Button>}
      </div>
      {brief && (
        <Panel title="Chart brief">
          <p>{brief.summary}</p>
          <ul className="mt-3 space-y-1 text-sm">{brief.alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul>
          <p className="mt-3 text-xs text-mute">{brief.disclaimer} No-show heuristic: {brief.noShowRisk}.</p>
        </Panel>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Allergies">
          <div className="space-y-2">
            {data.allergies.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.substance} · {item.reaction}</span>
                <Badge tone={statusTone(item.severity)}>{item.severity}</Badge>
              </div>
            ))}
            {!data.allergies.length && <p className="text-sm text-mute">None recorded.</p>}
          </div>
          {can('patients.write') && (
            <form className="mt-4 grid gap-2 sm:grid-cols-3" onSubmit={addAllergy}>
              <input className={control} placeholder="Substance" required value={allergy.substance} onChange={(event) => setAllergy({ ...allergy, substance: event.target.value })} />
              <input className={control} placeholder="Reaction" value={allergy.reaction} onChange={(event) => setAllergy({ ...allergy, reaction: event.target.value })} />
              <Button type="submit">Add</Button>
            </form>
          )}
        </Panel>
        <Panel title="History">
          {data.conditions.map((item) => <div key={item.id} className="py-1">{item.name} · {item.status}</div>)}
          {data.surgeries.map((item) => <div key={item.id} className="py-1">Surgery · {item.procedure_name}</div>)}
          {data.family.map((item) => <div key={item.id} className="py-1">Family · {item.relation}: {item.condition}</div>)}
          {data.contacts.map((item) => <div key={item.id} className="py-1">Emergency · {item.name} ({item.relationship}) {item.phone}</div>)}
          {data.policies.map((item) => <div key={item.id} className="py-1">Cover · {item.insurer_name} {item.plan_name} · {item.member_number}</div>)}
          {data.consents.map((item) => <div key={item.id} className="py-1">Consent · {item.consent_type}: {item.granted ? 'granted' : 'declined'}</div>)}
        </Panel>
      </div>
      <Panel title="Timeline">
        {events.map((event) => (
          <div key={`${event.kind}-${event.id}`} className="flex justify-between gap-3 border-b border-line py-2 text-sm">
            <span><Badge>{event.kind}</Badge> <span className="ml-2">{event.title}</span></span>
            <span className="text-mute">{when(event.at)} · {event.detail}</span>
          </div>
        ))}
      </Panel>
      <Field label="Notes"><p className="text-sm">{patient.notes || 'No chart notes yet.'}</p></Field>
    </div>
  );
}
