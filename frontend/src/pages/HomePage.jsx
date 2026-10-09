import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Aurora from '../bits/Aurora';
import BlurText from '../bits/BlurText';
import GradientText from '../bits/GradientText';
import SpotlightCard from '../bits/SpotlightCard';

const ROOMS = [
  ['01', 'Front desk', 'Appointments, walk-ins, tokens, and the waiting list for each branch.'],
  ['02', 'The chart', 'Encounters, vitals, prescriptions, labs, and imaging stay on one timeline.'],
  ['03', 'The counter', 'Pharmacy stock, invoices, insurance claims, and what is still unpaid.'],
  ['04', 'The organization', 'Several clinics, one tenant. Branding, roles, and a plan that can expire.']
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sand text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-sand/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="font-display text-2xl tracking-tight">Linden</a>
          <nav className="hidden items-center gap-6 text-sm text-mute sm:flex">
            <a href="#care" className="hover:text-ink">The day</a>
            <a href="#rooms" className="hover:text-ink">Clinics</a>
          </nav>
          <Link to="/login" className="rounded-full bg-moss-deep px-4 py-2 text-sm text-sand">Login</Link>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <Aurora colorStops={['#f3efe6', '#8fd0b8', '#e7b08a']} amplitude={0.8} blend={0.55} />
          </div>
          <div className="relative mx-auto max-w-6xl px-5 py-16 lg:py-24">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <p className="text-xs tracking-[0.28em] text-mute">MULTI-TENANT CLINIC OS</p>
              <BlurText
                text="The clinic, from the front desk to the chart."
                className="font-display mt-4 max-w-xl text-4xl leading-[0.95] text-ink sm:text-5xl lg:text-6xl"
                delay={50}
              />
              <p className="mt-6 max-w-md text-lg text-mute">
                Each organization keeps its own patients, branches, stock, and takings. The day’s board is already waiting inside.
              </p>
              <Link to="/login" className="mt-8 inline-flex rounded-full bg-moss px-5 py-3 text-sm font-medium text-white">Login</Link>
              <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
                {['Harbor Clinic', 'Ridge Street'].map((name) => (
                  <SpotlightCard key={name} theme="light" className="!p-5" spotlightColor="#c56a32">
                    <div className="text-xs tracking-widest text-mute">BRANCH</div>
                    <div className="mt-2 font-display text-2xl">{name}</div>
                  </SpotlightCard>
                ))}
              </div>
              <GradientText colors={['#1c6b52', '#c56a32', '#10241c']} className="mt-8 text-sm" animationSpeed={7}>
                Northwind Health · clinic code northwind
              </GradientText>
            </motion.div>
          </div>
        </section>

        <section id="care" className="mx-auto max-w-6xl px-5 pb-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['8', 'Patients on the Harbor registry'],
              ['4', 'Visits already on today’s book'],
              ['2', 'Clinics under one organization']
            ].map(([figure, label]) => (
              <div key={label} className="rounded-3xl border border-line bg-white px-5 py-6">
                <div className="font-display text-4xl text-moss">{figure}</div>
                <div className="mt-2 text-sm text-mute">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="rooms" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs tracking-[0.22em] text-mute">INSIDE A TENANT</p>
            <h2 className="font-display mt-3 text-4xl leading-none">One organization. As many branches as the plan allows.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ROOMS.map(([index, title, copy]) => (
              <article key={title} className="rounded-3xl border border-line bg-white p-5">
                <div className="font-display text-copper">{index}</div>
                <h3 className="font-display mt-3 text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-mute">
          <span className="font-display text-lg text-ink">Linden</span>
          <span>Muscat demo clinics · password Linden#2026</span>
          <Link to="/start" className="text-moss">Start a 14-day clinic</Link>
        </div>
      </footer>
    </div>
  );
}
