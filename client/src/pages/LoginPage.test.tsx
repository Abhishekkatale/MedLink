import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';
import { MemoryRouter, Route, Switch } from 'wouter'; // Using wouter's MemoryRouter

// Mock useAuth hook for overriding context values in tests
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'), // Import and retain default behavior
  useAuth: jest.fn(), // Mock useAuth
}));

// Mock useNavigate from wouter (or react-router-dom if that's used)
// Wouter's useLocation hook returns a navigate function as the second element.
const mockNavigate = jest.fn();
jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'),
  useLocation: () => ['/login', mockNavigate],
  Switch: ({ children }: { children: React.ReactNode[] }) => <div>{children}</div>,
  Route: ({ component: Component, path }: { component: React.ComponentType, path: string }) => {
    // Simplified Route mock for testing rendering
    if (path === '/login' || path ==='/dashboard') return <Component />;
    return null;
  },
}));


describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear();
    mockNavigate.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
    });
    // Reset global fetch mock for each test
    (global.fetch as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-token', user: { id: 1, name: 'Test User', username: 'testuser', role: 'patient' } }),
      })
    );
  });

  test('renders login form correctly', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to type in username and password fields', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls login API and context login on submit, then navigates', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
            <Switch>
                <Route path="/login" component={LoginPage} />
                <Route path="/dashboard">{() => <div>Dashboard Page</div>}</Route>
            </Switch>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('fake-token', { id: 1, name: 'Test User', username: 'testuser', role: 'patient' });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays error message on login failure', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      })
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
