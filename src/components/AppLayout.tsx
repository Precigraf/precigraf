import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Calculadora',
  '/gestao': 'Dashboard',
  '/produtos': 'Produtos',
  '/clientes': 'Clientes',
  '/orcamentos': 'Orçamentos',
  '/pedidos': 'Pedidos',
  '/agenda': 'Agenda',
  '/producao': 'Produção',
  '/financeiro': 'Financeiro',
  '/marketplace': 'Marketplace',
  '/perfil': 'Meu Perfil',
  '/upgrade': 'Upgrade',
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const title =
    ROUTE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/orcamentos') ? 'Orçamento' : 'Precigraf');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 px-2">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-foreground truncate sm:hidden">
              {title}
            </span>
          </header>
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
