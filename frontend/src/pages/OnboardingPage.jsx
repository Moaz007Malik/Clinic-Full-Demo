import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api, setToken } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button, Field, control } from '../components/ui';

const STEPS = ['Organization', 'Brand', 'First branch', 'Administrator'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationName: '',
    slug: '',
    city: '',
    country: 'Pakistan',
    phone: '',
    primaryColor: '#1c6b52',
    accentColor: '#c56a32',
    clinicName: '',
    address: '',
    adminName: '',
    email: '',
    password: ''
  });

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setError('');
    try {
      const result = await api('/api/auth/onboard', { method: 'POST', body: form });
      setToken(result.token);
      await refresh();
      navigate('/app');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <Link className="text-sm text-mute" to="/">Back to sign in</Link>
      <h1 className="font-display mt-4 text-5xl">Open a clinic group.</h1>
      <p className="mt-3 max-w-xl text-mute">Fourteen days on the Starter plan. Your clinic code becomes the sign-in tenant, for example <span className="text-ink">northwind</span>.</p>
      <div className="mt-8 flex gap-2">
        {STEPS.map((label, index) => (
          <div key={label} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-moss' : 'bg-line'}`} />
        ))}
      </div>
      <form className="mt-8" onSubmit={submit}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="grid gap-4 sm:grid-cols-2">
            {step === 0 && (
              <>
                <Field label="Organization name"><input className={control} required value={form.organizationName} onChange={(event) => set('organizationName', event.target.value)} /></Field>
                <Field label="Clinic code"><input className={control} required minLength={3} value={form.slug} onChange={(event) => set('slug', event.target.value.toLowerCase())} /></Field>
                <Field label="City"><input className={control} value={form.city} onChange={(event) => set('city', event.target.value)} /></Field>
                <Field label="Phone"><input className={control} value={form.phone} onChange={(event) => set('phone', event.target.value)} /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <Field label="Primary color"><input className={control} type="color" value={form.primaryColor} onChange={(event) => set('primaryColor', event.target.value)} /></Field>
                <Field label="Accent color"><input className={control} type="color" value={form.accentColor} onChange={(event) => set('accentColor', event.target.value)} /></Field>
                <div className="sm:col-span-2 rounded-3xl p-8 text-white" style={{ background: form.primaryColor }}>
                  <div className="font-display text-4xl">{form.organizationName || 'Your clinic'}</div>
                  <div className="mt-2" style={{ color: form.accentColor }}>Accent sample</div>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Field label="First branch"><input className={control} required value={form.clinicName} onChange={(event) => set('clinicName', event.target.value)} /></Field>
                <Field label="Address"><input className={control} value={form.address} onChange={(event) => set('address', event.target.value)} /></Field>
              </>
            )}
            {step === 3 && (
              <>
                <Field label="Your name"><input className={control} required value={form.adminName} onChange={(event) => set('adminName', event.target.value)} /></Field>
                <Field label="Email"><input className={control} type="email" required value={form.email} onChange={(event) => set('email', event.target.value)} /></Field>
                <Field label="Password"><input className={control} type="password" required value={form.password} onChange={(event) => set('password', event.target.value)} /></Field>
                <p className="text-sm text-mute">Use 10 or more characters with upper and lower case, a number, and a symbol.</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        {error && <p className="mt-4 text-sm text-red-800">{error}</p>}
        <div className="mt-6 flex gap-3">
          {step > 0 && <Button type="button" tone="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button type="submit">{step === 3 ? 'Create organization' : 'Continue'}</Button>
        </div>
      </form>
    </div>
  );
}
