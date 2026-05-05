import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const AdminLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const { user } = useAuth();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="destructive" className="uppercase tracking-wide">
                Admin
              </Badge>
              {title && <h1 className="text-base font-semibold truncate">{title}</h1>}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[240px]">
              {user?.email}
            </span>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
