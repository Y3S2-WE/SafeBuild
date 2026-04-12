import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/api', () => ({
  api: {
    getProfile: vi.fn()
  }
}));

const { api } = await import('../services/api');

const TestHarness = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="is-auth">{String(isAuthenticated)}</div>
      <div data-testid="user-name">{user ? user.firstName : 'none'}</div>
      <button
        type="button"
        onClick={() =>
          login({
            token: 'token-123',
            user: { firstName: 'Jane', lastName: 'Doe', role: 'worker' }
          })
        }
      >
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('sets unauthenticated state when no token is present', async () => {
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('is-auth')).toHaveTextContent('false');
    expect(api.getProfile).not.toHaveBeenCalled();
  });

  test('hydrates user from getProfile when token exists', async () => {
    localStorage.setItem('safebuild_token', 'token-1');
    api.getProfile.mockResolvedValue({
      data: { firstName: 'Hydrated', lastName: 'User', role: 'officer' }
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(api.getProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('user-name')).toHaveTextContent('Hydrated');
    expect(screen.getByTestId('is-auth')).toHaveTextContent('true');
  });

  test('login and logout update auth state and localStorage', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await user.click(screen.getByRole('button', { name: 'login' }));

    expect(localStorage.getItem('safebuild_token')).toBe('token-123');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Jane');
    expect(screen.getByTestId('is-auth')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(localStorage.getItem('safebuild_token')).toBeNull();
    expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    expect(screen.getByTestId('is-auth')).toHaveTextContent('false');
  });
});
