import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { Spinner } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import { ForgotPage, GoogleCallbackPage, LoginPage, RegisterPage, VerifyPage } from './pages/AuthPages.jsx';
import Onboarding from './pages/Onboarding.jsx';
import QueuePage from './pages/QueuePage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import CompanyPage from './pages/CompanyPage.jsx';
import AccessGate from './pages/AccessGate.jsx';
import AdminPage from './pages/AdminPage.jsx';
import EarningsPage from './pages/EarningsPage.jsx';

export default function App() {
  const { token, membership, loading } = useAuth();

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/auth/callback" element={<GoogleCallbackPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (loading && !membership) return <Spinner />;

  const isAdmin = !!membership?.isAdmin;
  const hasAccess = membership?.access === 'granted';
  const member = membership?.member;

  // بدون صلاحية مؤكّد (يمنحها الأدمن): طلب الصلاحية أو انتظارها
  if (!hasAccess && !isAdmin) return <AccessGate />;
  // لديه صلاحية لكن ليس في شركة: ينشئ شركته أو ينتظر أن يضيفه مديره
  if (!member && !isAdmin) return <Onboarding />;

  const isOwner = member?.role === 'owner';
  return (
    <Routes>
      <Route element={<Layout />}>
        {member ? <Route index element={<QueuePage />} /> : <Route index element={<Navigate to="/admin" replace />} />}
        {member && <Route path="orders/:id" element={<OrderPage />} />}
        {member && <Route path="history" element={<HistoryPage />} />}
        {isOwner && <Route path="earnings" element={<EarningsPage />} />}
        {isOwner && <Route path="team" element={<TeamPage />} />}
        {isOwner && <Route path="company" element={<CompanyPage />} />}
        {isAdmin && <Route path="admin" element={<AdminPage />} />}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
