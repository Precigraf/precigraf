import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User doesn't exist in our users table or is blocked
  if (!userData || userData.status !== 'ativo') {
    return <Navigate to="/login" replace />;
  }

  // Must change password - redirect to change password page (unless already there)
  if (userData.must_change_password && location.pathname !== '/alterar-senha') {
    return <Navigate to="/alterar-senha" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
