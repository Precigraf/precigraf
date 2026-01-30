import React, { forwardRef } from 'react';
import Header from '@/components/Header';
import CostCalculator from '@/components/CostCalculator';
import { useSecurityCheck } from '@/hooks/useSecurityCheck';

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  // Perform security checks on mount (fingerprint, session logging)
  useSecurityCheck();

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <CostCalculator />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 PreciGraf. Calculadora de Precificação.
          </p>
        </div>
      </footer>
    </div>
  );
});

Index.displayName = 'Index';

export default Index;
