import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

const { useAuth } = await import('../context/AuthContext');

const renderWithRouter = (initialEntry = '/secure') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/secure"
          element={
            <ProtectedRoute>
              <div>Secure Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  test('shows loading text while auth is loading', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    renderWithRouter();

    expect(screen.getByText('Loading your secure portal...')).toBeInTheDocument();
  });

  test('redirects unauthenticated users to login page', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders child content for authenticated users', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    renderWithRouter();

    expect(screen.getByText('Secure Content')).toBeInTheDocument();
  });
});
