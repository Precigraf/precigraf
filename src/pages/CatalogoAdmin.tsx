import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogSettingsForm } from '@/components/catalogo/CatalogSettingsForm';
import { BannerManager } from '@/components/catalogo/BannerManager';
import { FeaturedManager } from '@/components/catalogo/FeaturedManager';

const CatalogoAdmin: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Catálogo público</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma vitrine online para seus clientes finalizarem pedidos pelo WhatsApp.
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="featured">Destaques</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <CatalogSettingsForm />
          </TabsContent>
          <TabsContent value="banners">
            <BannerManager />
          </TabsContent>
          <TabsContent value="featured">
            <FeaturedManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CatalogoAdmin;
