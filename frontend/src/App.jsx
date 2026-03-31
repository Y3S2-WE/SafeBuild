import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PortalPage } from './pages/PortalPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ComplianceDashboardPage } from './pages/compliance/ComplianceDashboardPage';
import { ChecklistTemplatesPage } from './pages/compliance/ChecklistTemplatesPage';
import { AuditSchedulesPage } from './pages/compliance/AuditSchedulesPage';
import { ConductAuditPage } from './pages/compliance/ConductAuditPage';
import { CorrectiveActionsPage } from './pages/compliance/CorrectiveActionsPage';

const ComplianceAccessRoute = ({ children }) => {
  const { user } = useAuth();
  const allowedRoles = ['manager', 'officer'];

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

const ManagerAccessRoute = ({ children }) => {
  const { user } = useAuth();
  const allowedRoles = ['manager'];

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

const CorrectiveActionAccessRoute = ({ children }) => {
  const { user } = useAuth();
  const allowedRoles = ['manager', 'officer', 'safety-compliance-manager'];

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

const ConductAccessRoute = ({ children }) => {
  const { user } = useAuth();
  const allowedRoles = ['officer'];

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

const ComplianceRoute = ({ children }) => (
  <ProtectedRoute>
    <ComplianceAccessRoute>{children}</ComplianceAccessRoute>
  </ProtectedRoute>
);

const ManagerRoute = ({ children }) => (
  <ProtectedRoute>
    <ManagerAccessRoute>{children}</ManagerAccessRoute>
  </ProtectedRoute>
);

const CorrectiveActionRoute = ({ children }) => (
  <ProtectedRoute>
    <CorrectiveActionAccessRoute>{children}</CorrectiveActionAccessRoute>
  </ProtectedRoute>
);

const ConductRoute = ({ children }) => (
  <ProtectedRoute>
    <ConductAccessRoute>{children}</ConductAccessRoute>
  </ProtectedRoute>
);

const App = () => {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <PortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/compliance"
          element={
            <ComplianceRoute>
              <ComplianceDashboardPage />
            </ComplianceRoute>
          }
        />
        <Route
          path="/portal/compliance/checklists"
          element={
            <ManagerRoute>
              <ChecklistTemplatesPage />
            </ManagerRoute>
          }
        />
        <Route
          path="/portal/compliance/audits"
          element={
            <ManagerRoute>
              <AuditSchedulesPage />
            </ManagerRoute>
          }
        />
        <Route
          path="/portal/compliance/conduct"
          element={
            <ConductRoute>
              <ConductAuditPage />
            </ConductRoute>
          }
        />
        <Route
          path="/portal/compliance/actions"
          element={
            <CorrectiveActionRoute>
              <CorrectiveActionsPage />
            </CorrectiveActionRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
};

export default App;