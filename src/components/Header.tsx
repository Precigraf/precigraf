import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Calculator className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                PreciGraf
              </h1>
              <p className="text-sm text-muted-foreground">
                Calculadora de Precificação
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
