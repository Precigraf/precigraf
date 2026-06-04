import React from 'react';
import AppLayout from '@/components/AppLayout';
import { CatalogoSubNav } from '@/components/catalogo/CatalogoSubNav';
import { FeaturedManager } from '@/components/catalogo/FeaturedManager';

const CatalogoDestaques: React.FC = () => (
  <AppLayout>
    <CatalogoSubNav />
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <FeaturedManager />
    </div>
  </AppLayout>
);

export default CatalogoDestaques;
