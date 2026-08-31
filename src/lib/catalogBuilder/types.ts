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
  Truck,
  Clock,
  Award,
  Heart,
  Baby,
  PawPrint,
  Coffee,
  Wine,
  Flower2,
  Leaf,
  Home,
  Briefcase,
  GraduationCap,
  PartyPopper,
  Church,
  Music,
  Camera,
  Laptop,
  Smartphone,
  Printer,
  Tag,
  Percent,
  BadgeCheck,
  ShieldCheck,
  Recycle,
  Droplets,
  Flame,
  Snowflake,
  Sun,
  Moon,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Store,
  Boxes,
  Weight,
  Maximize,
  Type as TypeIcon,
  Image as ImageIcon,
  Brush,
  PenTool,
  Stamp,
  Sticker,
  BookOpen,
  Bookmark,
  Calendar,
  CreditCard,
  Wallet,
  ThumbsUp,
  Smile,
  Zap,
  TrendingUp,
  Crown,
  Trophy,
  Rocket,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';

/** Dimensões lógicas fixas do catálogo (proporção 4:3). */
export const CATALOG_WIDTH = 1448;
export const CATALOG_HEIGHT = 1086;

export const MAX_PRICE_ROWS = 12;
export const MAX_IDEAL_FOR = 4;
export const MAX_SPECS = 10;

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
  cnpj: 20,
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
  | 'star'
  | 'truck'
  | 'clock'
  | 'award'
  | 'heart'
  | 'baby'
  | 'pet'
  | 'coffee'
  | 'wine'
  | 'flower'
  | 'leaf'
  | 'home'
  | 'briefcase'
  | 'graduation'
  | 'party'
  | 'church'
  | 'music'
  | 'camera'
  | 'laptop'
  | 'smartphone'
  | 'printer'
  | 'tag'
  | 'percent'
  | 'badge'
  | 'shield'
  | 'recycle'
  | 'droplets'
  | 'flame'
  | 'snowflake'
  | 'sun'
  | 'moon'
  | 'mappin'
  | 'phone'
  | 'mail'
  | 'globe'
  | 'instagram'
  | 'store'
  | 'boxes'
  | 'weight'
  | 'size'
  | 'font'
  | 'image'
  | 'brush'
  | 'pentool'
  | 'stamp'
  | 'sticker'
  | 'book'
  | 'bookmark'
  | 'calendar'
  | 'card'
  | 'wallet'
  | 'thumbsup'
  | 'smile'
  | 'zap'
  | 'trending'
  | 'crown'
  | 'trophy'
  | 'rocket'
  | 'money';

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
  truck: { label: 'Entrega', Icon: Truck },
  clock: { label: 'Prazo', Icon: Clock },
  award: { label: 'Qualidade', Icon: Award },
  heart: { label: 'Favoritos', Icon: Heart },
  baby: { label: 'Infantil', Icon: Baby },
  pet: { label: 'Pet', Icon: PawPrint },
  coffee: { label: 'Cafeteria', Icon: Coffee },
  wine: { label: 'Bebidas', Icon: Wine },
  flower: { label: 'Floricultura', Icon: Flower2 },
  leaf: { label: 'Natural', Icon: Leaf },
  home: { label: 'Casa', Icon: Home },
  briefcase: { label: 'Corporativo', Icon: Briefcase },
  graduation: { label: 'Formatura', Icon: GraduationCap },
  party: { label: 'Festas', Icon: PartyPopper },
  church: { label: 'Religioso', Icon: Church },
  music: { label: 'Música', Icon: Music },
  camera: { label: 'Fotografia', Icon: Camera },
  laptop: { label: 'Digital', Icon: Laptop },
  smartphone: { label: 'Celular', Icon: Smartphone },
  printer: { label: 'Impressão', Icon: Printer },
  tag: { label: 'Etiqueta', Icon: Tag },
  percent: { label: 'Desconto', Icon: Percent },
  badge: { label: 'Selo', Icon: BadgeCheck },
  shield: { label: 'Garantia', Icon: ShieldCheck },
  recycle: { label: 'Reciclável', Icon: Recycle },
  droplets: { label: 'Impermeável', Icon: Droplets },
  flame: { label: 'Resistente', Icon: Flame },
  snowflake: { label: 'Refrigerado', Icon: Snowflake },
  sun: { label: 'Verão', Icon: Sun },
  moon: { label: 'Noite', Icon: Moon },
  mappin: { label: 'Localização', Icon: MapPin },
  phone: { label: 'Telefone', Icon: Phone },
  mail: { label: 'E-mail', Icon: Mail },
  globe: { label: 'Site', Icon: Globe },
  instagram: { label: 'Instagram', Icon: Instagram },
  store: { label: 'Loja', Icon: Store },
  boxes: { label: 'Lote', Icon: Boxes },
  weight: { label: 'Peso', Icon: Weight },
  size: { label: 'Tamanho', Icon: Maximize },
  font: { label: 'Tipografia', Icon: TypeIcon },
  image: { label: 'Arte', Icon: ImageIcon },
  brush: { label: 'Pintura', Icon: Brush },
  pentool: { label: 'Design', Icon: PenTool },
  stamp: { label: 'Carimbo', Icon: Stamp },
  sticker: { label: 'Adesivo', Icon: Sticker },
  book: { label: 'Livro', Icon: BookOpen },
  bookmark: { label: 'Marcador', Icon: Bookmark },
  calendar: { label: 'Calendário', Icon: Calendar },
  card: { label: 'Cartão', Icon: CreditCard },
  wallet: { label: 'Pagamento', Icon: Wallet },
  thumbsup: { label: 'Recomendado', Icon: ThumbsUp },
  smile: { label: 'Satisfação', Icon: Smile },
  zap: { label: 'Rápido', Icon: Zap },
  trending: { label: 'Mais vendido', Icon: TrendingUp },
  crown: { label: 'Premium', Icon: Crown },
  trophy: { label: 'Destaque', Icon: Trophy },
  rocket: { label: 'Lançamento', Icon: Rocket },
  money: { label: 'Preço', Icon: CircleDollarSign },
};

export const CATALOG_ICON_KEYS = Object.keys(CATALOG_ICONS) as CatalogIconKey[];

export function getCatalogIcon(key: string): LucideIcon {
  return CATALOG_ICONS[key as CatalogIconKey]?.Icon ?? Star;
}

export type TypographyPreset =
  | 'moderna'
  | 'elegante'
  | 'minimalista'
  | 'comercial'
  | 'classica'
  | 'poppins'
  | 'montserrat'
  | 'poppins-montserrat'
  | 'playfair'
  | 'raleway'
  | 'oswald'
  | 'lora'
  | 'nunito';

/** Famílias Google Fonts usadas pelos presets — precisam ser injetadas na página. */
export const CATALOG_GOOGLE_FONTS = [
  'Poppins',
  'Montserrat',
  'Playfair Display',
  'Raleway',
  'Oswald',
  'Lora',
  'Nunito',
  'Roboto',
];

/** Injeta as Google Fonts usadas pelo construtor de catálogos. */
export function injectCatalogBuilderFonts() {
  if (typeof document === 'undefined') return;
  const id = 'catalog-builder-google-fonts';
  if (document.getElementById(id)) return;
  const families = CATALOG_GOOGLE_FONTS.map(
    (f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`,
  ).join('&');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.id = id;
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}

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
  poppins: {
    label: 'Poppins',
    heading: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
    body: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 700,
    tracking: '-0.01em',
  },
  montserrat: {
    label: 'Montserrat',
    heading: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    body: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 800,
    tracking: '-0.01em',
  },
  'poppins-montserrat': {
    label: 'Montserrat + Poppins',
    heading: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    body: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 700,
    tracking: '0em',
  },
  playfair: {
    label: 'Playfair',
    heading: "'Playfair Display', Georgia, serif",
    body: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 700,
    tracking: '0em',
  },
  raleway: {
    label: 'Raleway',
    heading: "'Raleway', 'Helvetica Neue', Arial, sans-serif",
    body: "'Raleway', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 700,
    tracking: '0.02em',
  },
  oswald: {
    label: 'Oswald',
    heading: "'Oswald', 'Helvetica Neue', Arial, sans-serif",
    body: "'Nunito', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 600,
    tracking: '0.04em',
  },
  lora: {
    label: 'Lora',
    heading: "'Lora', Georgia, serif",
    body: "'Lora', Georgia, serif",
    headingWeight: 700,
    tracking: '0.01em',
  },
  nunito: {
    label: 'Nunito',
    heading: "'Nunito', 'Helvetica Neue', Arial, sans-serif",
    body: "'Nunito', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 800,
    tracking: '-0.01em',
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
  /** Preço promocional opcional (usado quando showDiscount = true). */
  promoPrice?: number | null;
  /** Nº de unidades da faixa. Quando ausente, é lido do texto de `quantity`. */
  units?: number | null;
  /** Etiqueta estratégica livre (ex.: "Mais vendido"). */
  badge?: string;
  /** Opção em destaque (apenas uma por tabela). */
  featured?: boolean;
}

export interface CatalogPricing {
  title: string;
  type: PricingType;
  showUnitLabel: boolean;
  /** Exibe a coluna de preço promocional com o % de desconto. */
  showDiscount: boolean;
  /** Destaca o valor total do pedido como informação principal. */
  showTotals?: boolean;
  /** Exibe "Economize R$ X" quando houver diferença entre normal e atual. */
  showSavings?: boolean;
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

export interface CatalogFooter {
  showCnpj: boolean;
  cnpj: string;
}

export interface CatalogConfig {
  version: number;
  brand: CatalogBrand;
  footer: CatalogFooter;
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
    footer: { showCnpj: false, cnpj: '' },
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
      showDiscount: false,
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
    footer: { ...base.footer, ...(cfg.footer ?? {}) },
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
