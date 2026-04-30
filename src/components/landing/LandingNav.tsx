import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LogoIcon from '@/components/LogoIcon';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const LandingNav: React.FC = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/lp" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
            <LogoIcon className="w-4 h-4 text-background" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-foreground">PreciGraf</p>
            <p className="text-[10px] text-muted-foreground -mt-0.5">
              Precificação Inteligente
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link to="/">Ir para o app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/cadastro">Começar grátis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
