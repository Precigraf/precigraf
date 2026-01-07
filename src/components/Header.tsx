import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Sparkles, LogOut, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
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
          </Link>

          <div className="flex items-center gap-4">
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
                    <button className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Sparkles className="w-4 h-4" />
                      Upgrade Pro
                    </button>
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
                    <Button variant="default" className="gold-gradient hover:opacity-90 text-primary-foreground border-0 gap-2">
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
