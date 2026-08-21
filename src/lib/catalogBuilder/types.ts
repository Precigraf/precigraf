import {
  Gem,
  Diamond,
  Watch,
  Shirt,
  Sparkles,
  SprayCan,
  Gift,
  Glasses,
  Utensils,
  Cake,
  NotebookPen,
  Scissors,
  ShoppingBag,
  Box,
  Ruler,
  FileText,
  Layers,
  Palette,
  Package,
  Star,
  type LucideIcon,
} from 'lucide-react';

/** Dimensões lógicas fixas do catálogo (proporção 4:3). */
export const CATALOG_WIDTH = 1448;
export const CATALOG_HEIGHT = 1086;

export const MAX_PRICE_ROWS = 6;
export const MAX_IDEAL_FOR = 4;
export const MAX_SPECS = 4;

export const TEXT_LIMITS = {
  brandName: 28,
  slogan: 60,
  productTitle: 16,
  productHighlight: 12,
  productSubtitle: 20,
  pricingTitle: 26,
  idealForTitle: 20,
  idealForLabel: 24,
  specLabel: 18,
  specValue: 26,
  quantity: 14,
  catalogName: 60,
} as const;

export type CatalogIconKey =
  | 'gem'
  | 'diamond'
  | 'watch'
  | 'shirt'
  | 'sparkles'
  | 'perfume'
  | 'gift'
  | 'glasses'
  | 'food'
  | 'cake'
  | 'stationery'
  | 'craft'
  | 'bag'
  | 'box'
  | 'ruler'
  | 'paper'
  | 'layers'
  | 'palette'
  | 'package'
  | 'star';

export const CATALOG_ICONS: Record<CatalogIconKey, { label: string; Icon: LucideIcon }> = {
  gem: { label: 'Joias', Icon: Gem },
  diamond: { label: 'Diamante', Icon: Diamond },
  watch: { label: 'Relógio', Icon: Watch },
  shirt: { label: 'Roupas', Icon: Shirt },
  sparkles: { label: 'Cosméticos', Icon: Sparkles },
  perfume: { label: 'Perfume', Icon: SprayCan },
  gift: { label: 'Presentes', Icon: Gift },
  glasses: { label: 'Acessórios', Icon: Glasses },
  food: { label: 'Alimentos', Icon: Utensils },
  cake: { label: 'Doces', Icon: Cake },
  stationery: { label: 'Papelaria', Icon: NotebookPen },
  craft: { label: 'Artesanato', Icon: Scissors },
  bag: { label: 'Sacola', Icon: ShoppingBag },
  box: { label: 'Caixa', Icon: Box },
  ruler: { label: 'Medida', Icon: Ruler },
  paper: { label: 'Papel', Icon: FileText },
  layers: { label: 'Acabamento', Icon: Layers },
  palette: { label: 'Cores', Icon: Palette },
  package: { label: 'Embalagem', Icon: Package },
  star: { label: 'Outros', Icon: Star },
};

export const CATALOG_ICON_KEYS = Object.keys(CATALOG_ICONS) as CatalogIconKey[];

export function getCatalogIcon(key: string): LucideIcon {
  return CATALOG_ICONS[key as CatalogIconKey]?.Icon ?? Star;
}

export type TypographyPreset = 'moderna' | 'elegante' | 'minimalista' | 'comercial' | 'classica';

export const TYPOGRAPHY_PRESETS: Record<
  TypographyPreset,
  { label: string; heading: string; body: string; headingWeight: number; tracking: string }
> = {
  moderna: {
    label: 'Moderna',
    heading: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingWeight: 800,
    tracking: '-0.02em',
  },
  elegante: {
    label: 'Elegante',
    heading: "Georgia, 'Times New Roman', serif",
    body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingWeight: 700,
    tracking: '0.01em',
  },
  minimalista: {
    label: 'Minimalista',
    heading: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingWeight: 300,
    tracking: '0.12em',
  },
  comercial: {
    label: 'Comercial',
    heading: "Verdana, Geneva, sans-serif",
    body: "Verdana, Geneva, sans-serif",
    headingWeight: 700,
    tracking: '0em',
  },
  classica: {
    label: 'Clássica',
    heading: "'Times New Roman', Times, serif",
    body: "Georgia, 'Times New Roman', serif",
    headingWeight: 700,
    tracking: '0.02em',
  },
};

export type PhotoBorder = 'primary' | 'secondary' | 'none';
export type CornerStyle = 'straight' | 'rounded';
export type PricingType = 'unit' | 'total';
export type PricingSource = 'manual' | 'precigraf';

export type BrandHeaderLayout = 'centered' | 'side';

export interface CatalogBrand {
  logoUrl: string | null;
  logoPath: string | null;
  name: string;
  slogan: string;
  showLogo: boolean;
  showName: boolean;
  showSlogan: boolean;
  headerLayout: BrandHeaderLayout;
}

export interface CatalogImageTransform {
  zoom: number;
  x: number;
  y: number;
}

export interface CatalogProduct {
  title: string;
  highlight: string;
  subtitle: string;
  imageUrl: string | null;
  imagePath: string | null;
  imageTransform: CatalogImageTransform;
  imageWidth: number | null;
  imageHeight: number | null;
}

export interface CatalogPriceRow {
  id: string;
  quantity: string;
  price: number;
}

export interface CatalogPricing {
  title: string;
  type: PricingType;
  showUnitLabel: boolean;
  source: PricingSource;
  sourceProductId: string | null;
  rows: CatalogPriceRow[];
}

export interface CatalogIdealForItem {
  id: string;
  icon: CatalogIconKey;
  label: string;
}

export interface CatalogIdealFor {
  title: string;
  items: CatalogIdealForItem[];
}

export interface CatalogSpecification {
  id: string;
  icon: CatalogIconKey;
  label: string;
  value: string;
}

export interface CatalogAppearance {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  photoBorder: PhotoBorder;
  corners: CornerStyle;
  typography: TypographyPreset;
}

export interface CatalogConfig {
  version: number;
  brand: CatalogBrand;
  product: CatalogProduct;
  pricing: CatalogPricing;
  idealFor: CatalogIdealFor;
  specifications: CatalogSpecification[];
  appearance: CatalogAppearance;
  templateId: string;
}

export interface PriceCatalog {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  product_id: string | null;
  configuration: CatalogConfig;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function createDefaultConfig(): CatalogConfig {
  return {
    version: 1,
    templateId: 'classic-01',
    brand: {
      logoUrl: null,
      logoPath: null,
      name: 'Sua Marca',
      slogan: 'Embalagens que valorizam o seu produto',
      showLogo: true,
      showName: true,
      showSlogan: true,
      headerLayout: 'centered',
    },
    product: {
      title: 'SACOLA',
      highlight: 'MINI',
      subtitle: 'PERSONALIZADA',
      imageUrl: null,
      imagePath: null,
      imageTransform: { zoom: 1, x: 50, y: 50 },
      imageWidth: null,
      imageHeight: null,
    },
    pricing: {
      title: 'Tabela de valores',
      type: 'unit',
      showUnitLabel: true,
      source: 'manual',
      sourceProductId: null,
      rows: [
        { id: uid(), quantity: '20 unidades', price: 3.5 },
        { id: uid(), quantity: '50 unidades', price: 3.1 },
        { id: uid(), quantity: '100 unidades', price: 2.9 },
      ],
    },
    idealFor: {
      title: 'Ideal para',
      items: [
        { id: uid(), icon: 'gem', label: 'Joias e semijoias' },
        { id: uid(), icon: 'gift', label: 'Presentes' },
        { id: uid(), icon: 'glasses', label: 'Acessórios' },
      ],
    },
    specifications: [
      { id: uid(), icon: 'ruler', label: 'Medida', value: '10 x 12 x 4 cm' },
      { id: uid(), icon: 'bag', label: 'Alça', value: 'Elastano' },
      { id: uid(), icon: 'paper', label: 'Papel', value: '180g' },
      { id: uid(), icon: 'layers', label: 'Acabamento', value: 'Fosco ou brilho' },
    ],
    appearance: {
      primaryColor: '#1F2937',
      secondaryColor: '#C9A227',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF',
      photoBorder: 'secondary',
      corners: 'rounded',
      typography: 'moderna',
    },
  };
}

/** Faz merge seguro de uma configuração vinda do banco com os padrões. */
export function normalizeConfig(raw: unknown): CatalogConfig {
  const base = createDefaultConfig();
  if (!raw || typeof raw !== 'object') return base;
  const cfg = raw as Partial<CatalogConfig>;
  return {
    version: cfg.version ?? base.version,
    templateId: cfg.templateId ?? base.templateId,
    brand: { ...base.brand, ...(cfg.brand ?? {}) },
    product: {
      ...base.product,
      ...(cfg.product ?? {}),
      imageTransform: { ...base.product.imageTransform, ...(cfg.product?.imageTransform ?? {}) },
    },
    pricing: {
      ...base.pricing,
      ...(cfg.pricing ?? {}),
      rows: Array.isArray(cfg.pricing?.rows) && cfg.pricing!.rows.length
        ? cfg.pricing!.rows.slice(0, MAX_PRICE_ROWS)
        : base.pricing.rows,
    },
    idealFor: {
      ...base.idealFor,
      ...(cfg.idealFor ?? {}),
      items: Array.isArray(cfg.idealFor?.items)
        ? cfg.idealFor!.items.slice(0, MAX_IDEAL_FOR)
        : base.idealFor.items,
    },
    specifications: Array.isArray(cfg.specifications)
      ? cfg.specifications.slice(0, MAX_SPECS)
      : base.specifications,
    appearance: { ...base.appearance, ...(cfg.appearance ?? {}) },
  };
}

export const newId = uid;

export function formatBRL(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `R$ ${safe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function sanitizeFileName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'catalogo'
  );
}
