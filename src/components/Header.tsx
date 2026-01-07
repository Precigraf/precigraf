import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, LogOut, User, BarChart3, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const Header: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {user.email?.split('@')[0]}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" className="bg-foreground hover:bg-foreground/90 text-background border-0 gap-2">
                      <User className="w-4 h-4" />
                      Entrar
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
