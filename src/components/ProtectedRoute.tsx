import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado -> redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuário bloqueado
  if (userData && userData.status !== "ativo") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Acesso Bloqueado</h1>
          <p className="text-muted-foreground">
            Sua conta está bloqueada. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Precisa trocar senha -> redirecionar (exceto se já está na página de troca)
  if (userData?.must_change_password && location.pathname !== "/alterar-senha") {
    return <Navigate to="/alterar-senha" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
