import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Image as ImageIcon, Star, Settings as SettingsIcon } from 'lucide-react';

const tabs = [
  { to: '/catalogo-admin', label: 'Catálogo', icon: LayoutGrid, end: true },
  { to: '/catalogo-admin/banners', label: 'Banners', icon: ImageIcon },
  { to: '/catalogo-admin/destaques', label: 'Destaques', icon: Star },
  { to: '/catalogo-admin/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

export const CatalogoSubNav: React.FC = () => (
  <div className="border-b border-border bg-background sticky top-0 z-10">
    <div className="container mx-auto px-3 sm:px-4">
      <nav className="flex gap-1 overflow-x-auto -mb-px">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </div>
);
