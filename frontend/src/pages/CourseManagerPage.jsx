import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrainerCourseManager } from '../components/TrainerCourseManager';

export const CourseManagerPage = () => {
  const { user } = useAuth();

  if (user?.role !== 'trainer') {
    return <Navigate to="/dashboard" replace />;
  }

  return <TrainerCourseManager />;
};
