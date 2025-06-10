import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@shared/schema'; // Assuming User type is available

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  signup: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user'); // Clear corrupted user data
        localStorage.removeItem('token'); // Clear token as well
        setToken(null);
      }
    }
    setIsLoading(false);

    // Listener for auth errors from react-query or other sources
    const handleAuthError = () => {
      console.log("AuthContext: Caught auth-error event. Logging out.");
      logout();
      // Optionally, redirect to login page here or let components handle it based on isAuthenticated
      // Forcing a redirect here ensures immediate navigation to login.
      // window.location.href = '/login'; // This is a hard redirect. useNavigate from wouter is preferred if in a component.
      // Since AuthContext is not a component with router context, direct logout is primary.
      // Components relying on isAuthenticated will then trigger redirects via ProtectedRoute.
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const signup = (newToken: string, userData: User) => {
    // Signup essentially does the same as login in terms of client-side state
    login(newToken, userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
