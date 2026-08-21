import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import { canAccessCatalog } from '@/lib/featureFlags';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
  /** Quando true, o acesso continua restrito à allowlist de e-mails (recurso em construção). */
  emailAllowlist?: boolean;
}

const CatalogFeatureGate: React.FC<Props> = ({ children, emailAllowlist }) => {
  const { user } = useAuth();
  const { plan, loading } = useUserPlan();
  const navigate = useNavigate();

  if (emailAllowlist && !canAccessCatalog(user?.email)) {
    return <Navigate to="/app" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (plan !== 'pro') {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-12 max-w-xl">
          <Card className="bg-card border-border text-center">
            <CardHeader>
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <CardTitle>Catálogo de Preços é um recurso Pro</CardTitle>
              <CardDescription>
                Este recurso está disponível apenas para assinantes do Plano Pro. No plano gratuito
                ele fica bloqueado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2" size="lg" onClick={() => navigate('/upgrade')}>
                <Crown className="w-5 h-5" />
                Assinar plano Pro
              </Button>
            </CardContent>
          </Card>
        </main>
      </AppLayout>
    );
  }

  return <>{children}</>;
};

export default CatalogFeatureGate;
