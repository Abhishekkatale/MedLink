import React from 'react';
import { Route, Redirect, RouteProps } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps extends Omit<RouteProps, 'component'> {
  component: React.ComponentType<any>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Optional: Show a loading spinner or a blank page while auth state is loading
    // This prevents a flash of the login page before auth state is confirmed.
    return <div>Loading authentication status...</div>; // Or null, or a spinner component
  }

  return (
    <Route
      {...rest}
      component={(props: any) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default ProtectedRoute;
