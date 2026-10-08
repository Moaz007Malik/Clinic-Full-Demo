import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Shell from './components/Shell';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientPage from './pages/PatientPage';
import AppointmentsPage from './pages/AppointmentsPage';
import {
  AuditPage, BillingPage, ClinicalPage, DoctorsPage, FacilitiesPage, ImagingPage, InboxPage,
  InsurancePage, InventoryPage, LabPage, PeoplePage, PharmacyPage, PlatformPage, PortalPage,
  SettingsPage, TeamPage, TelemedPage
} from './pages/ClinicPages';

function Gate({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="p-10 text-mute">Opening Linden…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function Root() {
  const { session, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-mute">Opening Linden…</div>;
  if (session) return <Navigate to="/app" replace />;
  return <HomePage />;
}

function Login() {
  const { session, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-mute">Opening Linden…</div>;
  if (session) return <Navigate to="/app" replace />;
  return <LoginPage />;
}

const ROLE_HOME = {
  patient: '/app/portal',
  receptionist: '/app/appointments',
  nurse: '/app/appointments',
  pharmacist: '/app/pharmacy',
  lab_technician: '/app/lab',
  accountant: '/app/billing',
  hr_admin: '/app/team'
};

function Home() {
  const { session, can } = useAuth();
  const home = ROLE_HOME[session.user.roleKey];
  if (home) return <Navigate to={home} replace />;
  if (!can('reports.read')) return <Navigate to="/app/inbox" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/start" element={<OnboardingPage />} />
      <Route path="/app" element={<Gate><Shell /></Gate>}>
        <Route index element={<Home />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="records" element={<ClinicalPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="lab" element={<LabPage />} />
        <Route path="imaging" element={<ImagingPage />} />
        <Route path="pharmacy" element={<PharmacyPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="insurance" element={<InsurancePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="telemed" element={<TelemedPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="facilities" element={<FacilitiesPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="platform" element={<PlatformPage />} />
        <Route path="portal" element={<PortalPage />} />
      </Route>
    </Routes>
  );
}
