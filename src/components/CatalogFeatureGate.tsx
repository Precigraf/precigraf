import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessCatalog } from '@/lib/featureFlags';

const CatalogFeatureGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!canAccessCatalog(user?.email)) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
};

export default CatalogFeatureGate;
