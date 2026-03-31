import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PortalPage } from './pages/PortalPage';
import { LearningHubPage } from './pages/LearningHubPage';
import { LessonManagementPage } from './pages/LessonManagementPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { LessonViewerPage } from './pages/LessonViewerPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import IncidentListPage from './pages/IncidentListPage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentDetailPage from './pages/IncidentDetailPage';

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
        <Route path="/incidents" element={<IncidentListPage />} />
        <Route
          path="/incidents/report"
          element={
            <ProtectedRoute>
              <ReportIncidentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <ProtectedRoute>
              <IncidentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning-hub"
          element={
            <ProtectedRoute>
              <LearningHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson-management"
          element={
            <ProtectedRoute>
              <LessonManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course-detail"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson-viewer"
          element={
            <ProtectedRoute>
              <LessonViewerPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
};

export default App;
