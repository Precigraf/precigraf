import React from 'react';
import AppLayout from '@/components/AppLayout';
import { CatalogoSubNav } from '@/components/catalogo/CatalogoSubNav';
import { CatalogProductsManager } from '@/components/catalogo/CatalogProductsManager';

const CatalogoAdmin: React.FC = () => {
  return (
    <AppLayout>
      <CatalogoSubNav />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os produtos e categorias exibidos na sua vitrine pública.
          </p>
        </div>
        <CatalogProductsManager />
      </div>
    </AppLayout>
  );
};

export default CatalogoAdmin;
