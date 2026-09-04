import { useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ResidentDashboard } from './components/resident/ResidentDashboard';
import { MoveRequestPage } from './components/resident/MoveRequestPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminRequestPage } from './components/admin/AdminRequestPage';
import { WorkflowConfigPage } from './components/admin/WorkflowConfigPage';
import { DemoLoginPage } from './components/shared/DemoLoginPage';
import { clearCurrentDemoUser, demoDashboard, getCurrentDemoUser, setCurrentDemoUser } from './services/demoSession';
import type { DemoLoginResponse } from './types/demoLogin';

function DemoGuard({ user, role }: { user: DemoLoginResponse | null; role: DemoLoginResponse['userType'] }) {
  const { residentId, adminId, communityId } = useParams();
  if (!user) return <Navigate to="/" replace />;
  if (user.userType !== role || (residentId && residentId.toLowerCase() !== user.id.toLowerCase())
    || (adminId && adminId.toLowerCase() !== user.id.toLowerCase())
    || (communityId && communityId.toLowerCase() !== user.communityId.toLowerCase())) {
    return <Navigate to={demoDashboard(user)} replace />;
  }
  return <Outlet />;
}
function DashboardRoute() { const { residentId = '' } = useParams(); return <ResidentDashboard key={residentId} residentId={residentId} />; }
function RequestRoute() {
  const { residentId = '', requestId = '' } = useParams();
  return <MoveRequestPage key={`${residentId}/${requestId}`} residentId={residentId} requestId={requestId} />;
}
function AdminDashboardRoute() {
  const { adminId = '', communityId = '' } = useParams();
  return <AdminDashboard key={`${adminId}/${communityId}`} {...{ adminId, communityId }} />;
}
function AdminRequestRoute() {
  const { adminId = '', requestId = '' } = useParams();
  return <AdminRequestPage key={`${adminId}/${requestId}`} {...{ adminId, requestId }} />;
}
function WorkflowConfigRoute() {
  const { adminId = '', communityId = '' } = useParams();
  return <WorkflowConfigPage key={`${adminId}/${communityId}`} {...{ adminId, communityId }} />;
}
export function App() {
  const [user, setUser] = useState(getCurrentDemoUser);
  const navigate = useNavigate();
  function login(identity: DemoLoginResponse) {
    setCurrentDemoUser(identity); setUser(identity); navigate(demoDashboard(identity), { replace: true });
  }
  function logout() {
    clearCurrentDemoUser(); setUser(null); navigate('/', { replace: true });
  }
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><div className="shell header-content">
    <Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">a</span>anacity</Link>
    {user && <nav className="row" aria-label="Workspace"><span className="header-label">Welcome, {user.name}</span>
      <Link className="small" to={demoDashboard(user)}>Dashboard</Link><button className="text-button" type="button" onClick={logout}>Logout</button></nav>}
  </div></header><main id="main" className="shell">
    <Routes>
      <Route path="/" element={user ? <Navigate to={demoDashboard(user)} replace /> : <DemoLoginPage onLogin={login} />} />
      <Route element={<DemoGuard user={user} role="RESIDENT" />}>
      <Route path="/resident/:residentId" element={<DashboardRoute />} />
      <Route path="/resident/:residentId/move-requests/:requestId" element={<RequestRoute />} />
      </Route>
      <Route path="/admin" element={<Navigate to={user ? demoDashboard(user) : '/'} replace />} />
      <Route element={<DemoGuard user={user} role="ADMIN" />}>
      <Route path="/admin/:adminId/community/:communityId" element={<AdminDashboardRoute />} />
      <Route path="/admin/:adminId/community/:communityId/workflow-config" element={<WorkflowConfigRoute />} />
      <Route path="/admin/:adminId/move-requests/:requestId" element={<AdminRequestRoute />} />
      </Route>
      <Route path="*" element={<section className="panel"><h1 className="error-message" role="alert">Page not found</h1><Link to="/">Return home</Link></section>} />
    </Routes>
  </main><footer className="shell site-footer">Anacity · Move-in & move-out requests</footer></>;
}
