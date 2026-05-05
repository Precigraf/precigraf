import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Briefcase, ShieldCheck, Receipt, ArrowLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Usuários', url: '/admin/usuarios', icon: Users },
  { title: 'Planos', url: '/admin/planos', icon: CreditCard },
  { title: 'Funcionários', url: '/admin/funcionarios', icon: Briefcase },
  { title: 'Permissões', url: '/admin/permissoes', icon: ShieldCheck },
  { title: 'Pagamentos', url: '/admin/pagamentos', icon: Receipt },
];

export function AdminSidebar() {
  const { pathname } = useLocation();
  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + '/');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/app" className="flex items-center gap-2 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Sair do Admin</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
