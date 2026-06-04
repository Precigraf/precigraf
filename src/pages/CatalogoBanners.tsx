import React from 'react';
import AppLayout from '@/components/AppLayout';
import { CatalogoSubNav } from '@/components/catalogo/CatalogoSubNav';
import { BannerManager } from '@/components/catalogo/BannerManager';

const CatalogoBanners: React.FC = () => (
  <AppLayout>
    <CatalogoSubNav />
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <BannerManager />
    </div>
  </AppLayout>
);

export default CatalogoBanners;
