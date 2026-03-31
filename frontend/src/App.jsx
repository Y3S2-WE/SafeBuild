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
import { QuizAdminDashboard } from './pages/QuizAdminDashboard';
import { CertificationPage } from './pages/CertificationPage';
import { QuizWorkspace } from './pages/QuizWorkspace';
import { Certificate } from './pages/Certificate';
import { CertificateVerificationPage } from './pages/CertificateVerificationPage';

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

        <Route
          path="/quiz-admin"
          element={
            <ProtectedRoute>
              <QuizAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/certifications"
          element={
            <ProtectedRoute>
              <CertificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-workspace"
          element={
            <ProtectedRoute>
              <QuizWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificate"
          element={
            <ProtectedRoute>
              <Certificate />
            </ProtectedRoute>
          }
        />

        <Route path="/certificate-verify" element={<CertificateVerificationPage />} />
        <Route path="/certificate-verify/:code" element={<CertificateVerificationPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
};

export default App;
