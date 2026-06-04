import React from 'react';
import AppLayout from '@/components/AppLayout';
import { CatalogoSubNav } from '@/components/catalogo/CatalogoSubNav';
import { CatalogSettingsForm } from '@/components/catalogo/CatalogSettingsForm';

const CatalogoConfiguracoes: React.FC = () => (
  <AppLayout>
    <CatalogoSubNav />
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <CatalogSettingsForm />
    </div>
  </AppLayout>
);

export default CatalogoConfiguracoes;
