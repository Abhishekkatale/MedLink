import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import SignupPage from './SignupPage';
import { MemoryRouter, Route, Switch } from 'wouter';
import { UserRole } from '@shared/schema';

// Mock useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock wouter's useLocation for navigation
const mockNavigate = jest.fn();
jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'),
  useLocation: () => ['/signup', mockNavigate],
  Switch: ({ children }: { children: React.ReactNode[] }) => <div>{children}</div>,
  Route: ({ component: Component, path }: { component: React.ComponentType, path: string }) => {
    if (path === '/signup' || path ==='/dashboard') return <Component />;
    return null;
  },
}));

describe('SignupPage', () => {
  const mockSignup = jest.fn();

  beforeEach(() => {
    mockSignup.mockClear();
    mockNavigate.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      signup: mockSignup,
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
    });
    (global.fetch as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'new-fake-token', user: { id: 2, name: 'New User', username: 'newuser', role: UserRole.Values.patient } }),
      })
    );
  });

  test('renders signup form correctly', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /signup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument(); // Use regex for "Password:"
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signup/i })).toBeInTheDocument();
  });

  test('allows user to type in form fields and select a role', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Test User' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newtestuser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: UserRole.Values.admin } });

    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('New Test User');
    expect((screen.getByLabelText(/username/i) as HTMLInputElement).value).toBe('newtestuser');
    expect((screen.getByLabelText(/^password/i) as HTMLInputElement).value).toBe('newpassword123');
    expect((screen.getByLabelText(/role/i) as HTMLSelectElement).value).toBe(UserRole.Values.admin);
  });

  test('calls signup API and context signup on submit, then navigates', async () => {
     render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
            <Switch>
                <Route path="/signup" component={SignupPage} />
                <Route path="/dashboard">{() => <div>Dashboard Page</div>}</Route>
            </Switch>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: UserRole.Values.patient } });

    fireEvent.click(screen.getByRole('button', { name: /signup/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
        body: JSON.stringify({
          username: 'newuser',
          password: 'password123',
          role: UserRole.Values.patient,
          name: 'New User',
          title: "",
          organization: "",
          specialty: "",
          location: "",
          initials: ""
        })
      }));
    });

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('new-fake-token', { id: 2, name: 'New User', username: 'newuser', role: UserRole.Values.patient });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays error message on signup failure (e.g., username exists)', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Username already exists' }),
      })
    );

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Existing User' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: UserRole.Values.patient } });
    fireEvent.click(screen.getByRole('button', { name: /signup/i }));

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays error if required fields are not filled', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /signup/i }));

    await waitFor(() => {
        expect(screen.getByText("Please fill in all required fields.")).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSignup).not.toHaveBeenCalled();
  });
});
