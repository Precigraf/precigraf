import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visualize seus custos e compare cálculos salvos</p>
        </div>
        <Dashboard />
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Calculadora de Custos Gráficos. Feito para gráficas rápidas.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
