import Header from '@/components/Header';
import CostCalculator from '@/components/CostCalculator';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <CostCalculator />
      </main>

      {/* Footer */}
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

export default Index;
