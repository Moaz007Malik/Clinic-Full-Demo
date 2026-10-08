import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Magnet from '../bits/Magnet';
import { useAuth } from '../lib/auth';
import { Button, Field, control } from '../components/ui';

const DEMOS = [
  ['Platform owner', 'super@linden.local', ''],
  ['Organization admin', 'amira@northwind.local', 'northwind'],
  ['Doctor', 'dr.hassan@northwind.local', 'northwind'],
  ['Reception', 'rafi@northwind.local', 'northwind'],
  ['Pharmacist', 'samir@northwind.local', 'northwind'],
  ['Patient', 'maya@northwind.local', 'northwind']
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'amira@northwind.local', password: 'Linden#2026', slug: 'northwind', otp: '' });
  const [error, setError] = useState('');
  const [mfa, setMfa] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn({ email: form.email, password: form.password, slug: form.slug || null, otp: form.otp });
      navigate('/app');
    } catch (err) {
      setMfa(Boolean(err.mfaRequired));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-sand px-5 py-12">
    <form className="w-full max-w-md rounded-[2rem] border border-line bg-paper p-6 shadow-[0_24px_60px_rgba(16,36,28,0.08)] sm:p-8" onSubmit={submit}>
      <div className="mb-6">
        <div className="text-xs tracking-[0.22em] text-mute">SIGN IN</div>
        <h2 className="font-display mt-2 text-4xl">Welcome back.</h2>
      </div>
      <div className="space-y-4">
        <Field label="Clinic code">
          <input className={control} value={form.slug} placeholder="Leave blank for the platform owner" onChange={(event) => set('slug', event.target.value)} />
        </Field>
        <Field label="Email">
          <input className={control} type="email" value={form.email} onChange={(event) => set('email', event.target.value)} required />
        </Field>
        <Field label="Password">
          <input className={control} type="password" value={form.password} onChange={(event) => set('password', event.target.value)} required />
        </Field>
        {mfa && (
          <Field label="Authentication code">
            <input className={control} inputMode="numeric" value={form.otp} onChange={(event) => set('otp', event.target.value)} />
          </Field>
        )}
        {error && <p className="text-sm text-red-800">{error}</p>}
        <Magnet magnetStrength={4} padding={80}>
          <Button className="w-full py-3" disabled={busy}>{busy ? 'Checking…' : 'Enter clinic'}</Button>
        </Magnet>
      </div>
      <div className="mt-7">
        <div className="mb-2 text-xs tracking-widest text-mute">DEMO ACCOUNTS · Linden#2026</div>
        <div className="flex flex-wrap gap-2">
              {DEMOS.map(([label, email, slug]) => (
                <button
                  key={email}
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line"
                  onClick={() => {
                    const next = { email, password: 'Linden#2026', slug, otp: '' };
                    setForm(next);
                    setBusy(true);
                    setError('');
                    signIn({ email, password: next.password, slug: slug || null, otp: '' })
                      .then(() => navigate('/app'))
                      .catch((err) => {
                        setMfa(Boolean(err.mfaRequired));
                        setError(err.message);
                      })
                      .finally(() => setBusy(false));
                  }}
                >
                  {label}
                </button>
              ))}
        </div>
      </div>
      <p className="mt-6 text-sm text-mute">Opening a new organization? <Link className="text-moss" to="/start">Start a 14-day clinic</Link></p>
      <p className="mt-3 text-sm"><Link className="text-mute" to="/">Back to Linden</Link></p>
    </form>
    </div>
  );
}
