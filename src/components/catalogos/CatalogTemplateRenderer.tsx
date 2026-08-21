import React from 'react';
import { CatalogConfig } from '@/lib/catalogBuilder/types';
import ClassicCatalog from './templates/ClassicCatalog';

export interface CatalogTemplate {
  id: string;
  name: string;
  description: string;
  Component: React.FC<{ config: CatalogConfig }>;
}

export const CATALOG_TEMPLATES: CatalogTemplate[] = [
  {
    id: 'classic-01',
    name: 'Modelo 01 — Catálogo Clássico',
    description: 'Foto grande, tabela de valores, indicações de uso e ficha técnica no rodapé.',
    Component: ClassicCatalog,
  },
];

export function getTemplate(id: string): CatalogTemplate {
  return CATALOG_TEMPLATES.find((t) => t.id === id) ?? CATALOG_TEMPLATES[0];
}

/** Renderiza o template no tamanho lógico real — usado no preview e na exportação. */
const CatalogTemplateRenderer = React.forwardRef<HTMLDivElement, { config: CatalogConfig }>(
  ({ config }, ref) => {
    const { Component } = getTemplate(config.templateId);
    return (
      <div ref={ref} data-catalog-canvas>
        <Component config={config} />
      </div>
    );
  },
);
CatalogTemplateRenderer.displayName = 'CatalogTemplateRenderer';

export default CatalogTemplateRenderer;
