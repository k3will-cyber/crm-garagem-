import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check permission
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to dashboard (the role's home page)
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
