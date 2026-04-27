import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import TrialExpiredScreen from '@/components/TrialExpiredScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rotas permitidas mesmo com trial expirado (para o usuário conseguir fazer upgrade)
const ALLOWED_WHEN_EXPIRED = ['/upgrade', '/perfil', '/pagamento-confirmado'];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isTrialExpired, loading: planLoading } = useUserPlan();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in -> redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Aguardando dados do plano
  if (planLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Trial expirado em plano free: bloquear todo o sistema, exceto rotas essenciais para upgrade
  if (isTrialExpired && !ALLOWED_WHEN_EXPIRED.includes(location.pathname)) {
    return <TrialExpiredScreen />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
