import { LayoutDashboard, Calculator, Users, FileText, Package, LogOut, Settings, Sun, Moon, Store, Box, Wallet, Factory } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@/components/LogoIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/gestao', icon: LayoutDashboard },
  { title: 'Produtos', url: '/produtos', icon: Box },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText },
  { title: 'Pedidos', url: '/pedidos', icon: Package },
  { title: 'Produção', url: '/producao', icon: Factory },
  { title: 'Financeiro', url: '/financeiro', icon: Wallet },
  { title: 'Calculadora', url: '/', icon: Calculator },
  { title: 'Marketplace', url: '/marketplace', icon: Store },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={collapsed ? 'border-b border-border p-2' : 'border-b border-border p-4'}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <LogoIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Precigraf</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Sistema de Gestão</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {!collapsed && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/perfil')}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {user && !collapsed && (
          <div className="truncate">
            <p className="text-xs font-medium text-foreground truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
