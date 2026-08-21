import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Building2, ImageIcon, Table2, Sparkles, Info, Palette } from 'lucide-react';
import { CatalogConfig } from '@/lib/catalogBuilder/types';
import BrandSection from './sections/BrandSection';
import ProductSection from './sections/ProductSection';
import PricingSection from './sections/PricingSection';
import IdealForSection from './sections/IdealForSection';
import SpecificationsSection from './sections/SpecificationsSection';
import AppearanceSection from './sections/AppearanceSection';

export interface CatalogValidationErrors {
  productTitle?: string | null;
  pricingRows?: string | null;
}

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
  errors: CatalogValidationErrors;
  onUploadLogo: (file: File) => Promise<void>;
  onRemoveLogo: () => Promise<void>;
  onUploadPhoto: (file: File) => Promise<void>;
  onRemovePhoto: () => Promise<void>;
}

const CatalogEditor: React.FC<Props> = ({
  config,
  update,
  errors,
  onUploadLogo,
  onRemoveLogo,
  onUploadPhoto,
  onRemovePhoto,
}) => (
  <Accordion type="multiple" defaultValue={['marca']} className="w-full">
    <AccordionItem value="marca">
      <AccordionTrigger className="text-sm">
        <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Marca</span>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <BrandSection config={config} update={update} onUploadLogo={onUploadLogo} onRemoveLogo={onRemoveLogo} />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="produto">
      <AccordionTrigger className="text-sm">
        <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Produto</span>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <ProductSection
          config={config}
          update={update}
          onUploadPhoto={onUploadPhoto}
          onRemovePhoto={onRemovePhoto}
          titleError={errors.productTitle}
        />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="precos">
      <AccordionTrigger className="text-sm">
        <span className="flex items-center gap-2"><Table2 className="w-4 h-4" /> Tabela de preços</span>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <PricingSection config={config} update={update} rowsError={errors.pricingRows} />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="ideal">
      <AccordionTrigger className="text-sm">
        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Ideal para</span>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <IdealForSection config={config} update={update} />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="info">
      <AccordionTrigger className="text-sm">
        <span className="flex items-center gap-2"><Info className="w-4 h-4" /> Informações do produto</span>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <SpecificationsSection config={config} update={update} />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="aparencia">
      <AccordionTrigger className="text-sm">
        <span className="flex items-center gap-2"><Palette className="w-4 h-4" /> Aparência</span>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <AppearanceSection config={config} update={update} />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default CatalogEditor;
