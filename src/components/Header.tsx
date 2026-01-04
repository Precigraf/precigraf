import React from 'react';
import { Calculator, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-gold">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                Calculadora de Custos Gráficos
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                  BETA
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Calcule custos, margens e preços de venda
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Sparkles className="w-4 h-4" />
              Upgrade Pro
            </button>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
              G
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
