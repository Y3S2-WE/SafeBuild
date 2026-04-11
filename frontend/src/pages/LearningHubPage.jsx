import { Navigate } from 'react-router-dom';
import { WorkerLearningHub } from '../components/WorkerLearningHub';
import { useAuth } from '../context/AuthContext';

export const LearningHubPage = () => {
  const { user } = useAuth();

  if (user?.role !== 'worker') {
    return <Navigate to="/dashboard" replace />;
  }

  return <WorkerLearningHub />;
};
