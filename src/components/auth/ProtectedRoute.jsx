import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAutoAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ module, children }) {
  const { user, hasPermission } = useAutoAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (module && !hasPermission(module)) return <Navigate to="/" replace />;

  return children;
}