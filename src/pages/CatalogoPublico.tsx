import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Search, ShoppingCart, Clock, MessageCircle, Trash2, Package, Minus, Plus } from 'lucide-react';
import { usePublicCatalog, type PublicCatalogData, type PublicCatalogStore } from '@/hooks/useCatalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { injectCatalogFonts } from '@/lib/googleFonts';
import { ProductDetailModal, type CartLine } from '@/components/catalogo/public/ProductDetailModal';

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const radiusFor = (style?: string) => {
  if (style === 'pill') return '9999px';
  if (style === 'straight') return '0px';
  return '12px';
};

const CatalogoPublico: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = usePublicCatalog(slug);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<PublicCatalogData['products'][number] | null>(null);

  const store = data?.store;

  useEffect(() => {
    if (store) injectCatalogFonts([store.title_font, store.body_font].filter(Boolean) as string[]);
  }, [store?.title_font, store?.body_font]);

  // Catálogo público sempre em modo claro
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      root.classList.remove('light');
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  // Auto-rotate banner a cada 3s
  const bannerCount = data?.banners.length ?? 0;
  useEffect(() => {
    if (bannerCount < 2) return;
    const id = setInterval(() => setBannerIdx((i) => (i + 1) % bannerCount), 3000);
    return () => clearInterval(id);
  }, [bannerCount]);

  // Map parent → children to support subcategory chips
  const subcats = useMemo(() => {
    if (!data || !filterCat) return [];
    return data.categories.filter((c) => c.parent_id === filterCat);
  }, [data, filterCat]);

  const [subCat, setSubCat] = useState<string | null>(null);
  useEffect(() => { setSubCat(null); }, [filterCat]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.products.filter((p) => {
      const catActive = subCat ?? filterCat;
      if (catActive) {
        // If a parent is selected (no subCat), include children of that parent too
        const matchCat = subCat
          ? p.category_id === subCat
          : p.category_id === filterCat ||
            data.categories.some((c) => c.parent_id === filterCat && c.id === p.category_id);
        if (!matchCat) return false;
      }
      if (q) {
        const hay = [
          p.name,
          p.description ?? '',
          ...(p.variants ?? []).map((v) => v.name),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, filterCat, subCat, search]);

  const hasActiveFilters = !!search || !!filterCat;

  const total = cart.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (line: CartLine) => {
    setCart((prev) => {
      const same = prev.findIndex(
        (l) => l.product_id === line.product_id && l.variant_name === line.variant_name,
      );
      if (same >= 0) {
        const copy = [...prev];
        copy[same] = { ...copy[same], qty: copy[same].qty + line.qty };
        return copy;
      }
      return [...prev, line];
    });
  };

  const buyNow = (line: CartLine) => {
    addToCart(line);
    setCartOpen(true);
  };

  const updateQty = (key: string, delta: number) =>
    setCart((c) => c.flatMap((l) => {
      if (l.key !== key) return [l];
      const next = l.qty + delta;
      return next <= 0 ? [] : [{ ...l, qty: next }];
    }));

  const removeLine = (key: string) => setCart((c) => c.filter((i) => i.key !== key));

  const finalizeWhatsApp = () => {
    if (!data || cart.length === 0) return;
    const phone = (data.store.whatsapp ?? '').replace(/\D/g, '');
    if (!phone) { alert('Loja sem WhatsApp configurado.'); return; }
    const itensTxt = cart
      .map((i) => {
        const variant = i.variant_name ? ` (${i.variant_name})` : '';
        return `• ${i.qty}x ${i.product_name}${variant} — ${formatBRL(i.unit_price * i.qty)}`;
      })
      .join('\n');
    const msg = (data.store.whatsapp_message_template || 'Olá {loja}!\n{itens}\nTotal: {total}')
      .replace(/\{loja\}/g, data.store.name)
      .replace(/\{itens\}/g, itensTxt)
      .replace(/\{total\}/g, formatBRL(total));
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3 p-6 text-center">
        <Package className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Catálogo não encontrado</h1>
        <p className="text-sm text-muted-foreground">Verifique o link com a gráfica.</p>
      </div>
    );
  }

  const primary = store.primary_color;
  const headerBg = store.header_bg_color;
  const headerFg = store.header_text_color;
  const buttonBg = store.button_bg_color;
  const buttonFg = store.button_text_color;
  const buttonRadius = radiusFor(store.button_border_style);
  const titleFamily = `'${store.title_font}', sans-serif`;
  const bodyFamily = `'${store.body_font}', sans-serif`;
  const titleWeight = store.title_weight === 'light' ? 300 : store.title_weight === 'medium' ? 500 : 700;

  const banners = data.banners;
  const currentBanner = banners[bannerIdx];

  return (
    <div className="min-h-screen bg-muted/30" style={{ fontFamily: bodyFamily, color: store.title_color }}>
      <header className="border-b border-border sticky top-0 z-30" style={{ background: headerBg, color: headerFg }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-9 max-w-[160px] object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: primary }}>
                <Package className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium relative"
                style={{ background: buttonBg, color: buttonFg, borderRadius: buttonRadius }}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Carrinho
                {totalItems > 0 && (
                  <span className="ml-2 bg-white/25 rounded-full px-2 text-xs">{totalItems}</span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle>Seu carrinho</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4 space-y-2">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Carrinho vazio.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.key} className="flex gap-3 p-3 border border-border rounded-lg">
                      <div className="w-14 h-14 bg-muted rounded shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/50" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.product_name}</div>
                        {item.variant_name && (
                          <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="inline-flex items-center border border-border rounded-full">
                            <button onClick={() => updateQty(item.key, -1)} className="w-6 h-6 flex items-center justify-center" aria-label="−"><Minus className="w-3 h-3" /></button>
                            <span className="w-6 text-center text-xs">{item.qty}</span>
                            <button onClick={() => updateQty(item.key, +1)} className="w-6 h-6 flex items-center justify-center" aria-label="+"><Plus className="w-3 h-3" /></button>
                          </div>
                          <span className="text-xs text-muted-foreground">×</span>
                          <span className="text-xs">{formatBRL(item.unit_price)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLine(item.key)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                        <div className="font-semibold text-sm" style={{ color: store.price_color }}>
                          {formatBRL(item.unit_price * item.qty)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">{formatBRL(total)}</span>
                  </div>
                  <button
                    className="w-full inline-flex items-center justify-center px-4 py-3 text-white font-medium bg-[#1D9E75] hover:bg-[#1D9E75]/90"
                    style={{ borderRadius: buttonRadius }}
                    onClick={finalizeWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Finalizar pelo WhatsApp
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Você será redirecionado com a mensagem pronta para enviar.
                  </p>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {currentBanner && (
          <div className="relative overflow-hidden flex items-center"
            style={{
              background: currentBanner.bg_color,
              minHeight: 180,
              backgroundImage: currentBanner.image_desktop_url ? `url(${currentBanner.image_desktop_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              aspectRatio: currentBanner.image_desktop_url ? '3 / 1' : undefined,
            }}>
            {(currentBanner.title || currentBanner.subtitle) && !currentBanner.image_desktop_url && (
              <div className="px-6 py-8 sm:px-12 text-white max-w-2xl">
                {currentBanner.eyebrow && (
                  <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 mb-2">{currentBanner.eyebrow}</div>
                )}
                <h2 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: titleFamily, fontWeight: titleWeight }}>
                  {currentBanner.title}
                </h2>
                {currentBanner.subtitle && <p className="text-sm opacity-90 mb-4">{currentBanner.subtitle}</p>}
                {currentBanner.cta_label && currentBanner.cta_url && (
                  <a href={currentBanner.cta_url} target="_blank" rel="noreferrer"
                    className="inline-block px-5 py-2 bg-white/20 hover:bg-white/30 text-sm font-medium"
                    style={{ borderRadius: buttonRadius }}>
                    {currentBanner.cta_label}
                  </a>
                )}
              </div>
            )}
            {banners.length > 1 && (
              <div className="absolute bottom-3 right-4 flex gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setBannerIdx(i)} className="h-1.5 rounded-full transition-all"
                    style={{ width: i === bannerIdx ? 18 : 6, background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)' }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-background border-b border-border px-4 py-3 space-y-2">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-1 flex-nowrap overflow-x-auto -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
              <button onClick={() => setFilterCat(null)}
                className={`shrink-0 px-3 py-1.5 text-sm transition ${!filterCat ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
                style={!filterCat ? { background: primary, borderRadius: buttonRadius } : { borderRadius: buttonRadius }}>
                Todos
              </button>
              {data.categories.filter((c) => !c.parent_id).map((c) => (
                <button key={c.id} onClick={() => setFilterCat(c.id)}
                  className={`shrink-0 px-3 py-1.5 text-sm transition ${filterCat === c.id ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
                  style={filterCat === c.id ? { background: primary, borderRadius: buttonRadius } : { borderRadius: buttonRadius }}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-9 h-9 rounded-full" />
            </div>
          </div>

          {subcats.length > 0 && (
            <div className="flex gap-1 flex-nowrap overflow-x-auto -mx-1 px-1 sm:flex-wrap pt-1">
              <button onClick={() => setSubCat(null)}
                className={`shrink-0 px-2.5 py-1 text-xs transition border ${!subCat ? 'border-foreground/40 text-foreground' : 'border-border text-muted-foreground'}`}
                style={{ borderRadius: buttonRadius }}>
                Todas as subcategorias
              </button>
              {subcats.map((sc) => (
                <button key={sc.id} onClick={() => setSubCat(sc.id)}
                  className={`shrink-0 px-2.5 py-1 text-xs transition border ${subCat === sc.id ? 'border-foreground/40 text-foreground' : 'border-border text-muted-foreground'}`}
                  style={{ borderRadius: buttonRadius }}>
                  {sc.name}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button onClick={() => { setSearch(''); setFilterCat(null); setSubCat(null); }}
              className="text-xs text-muted-foreground hover:text-foreground underline">
              Limpar filtros
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum produto encontrado.</p>
              {hasActiveFilters && (
                <button onClick={() => { setSearch(''); setFilterCat(null); setSubCat(null); }}
                  className="text-xs mt-2 underline text-foreground">
                  Ver todos os produtos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  store={store}
                  onOpen={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
          Pedido enviado pelo WhatsApp diretamente para {store.name}.
        </footer>
      </div>

      <ProductDetailModal
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        product={selected}
        store={store}
        onAdd={addToCart}
        onBuyNow={buyNow}
      />
    </div>
  );
};

interface PCardProps {
  product: PublicCatalogData['products'][number];
  store: PublicCatalogStore;
  onOpen: () => void;
}

const ProductCard: React.FC<PCardProps> = ({ product, store, onOpen }) => {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const basePrice = product.promo_price ?? product.price;
  const minPrice = hasVariants ? Math.min(...variants.map((v) => v.price)) : basePrice;
  const thumb = product.images?.[0];

  const cardRadius = store.product_border_style === 'rounded' ? '16px' : '0px';
  const buttonRadius = radiusFor(store.button_border_style);
  const titleFamily = `'${store.title_font}', sans-serif`;
  const titleWeight = store.title_weight === 'light' ? 300 : store.title_weight === 'medium' ? 500 : 700;
  const aspect =
    store.product_image_shape === 'rectangle' ? '4 / 3'
      : store.product_image_shape === 'full' ? '16 / 9'
      : '1 / 1';
  const align = store.product_text_align === 'center' ? 'center' : 'left';
  const transform: React.CSSProperties['textTransform'] =
    store.product_name_case === 'uppercase' ? 'uppercase' : 'none';

  const showButton = store.product_buy_button !== 'none';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className="bg-background border border-border overflow-hidden hover:border-muted-foreground/30 hover:shadow-md transition cursor-pointer text-left"
      style={{ borderRadius: cardRadius, textAlign: align }}
    >
      <div className="bg-muted/40 border-b border-border flex items-center justify-center relative overflow-hidden" style={{ aspectRatio: aspect }}>
        {thumb ? (
          <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground/50" />
        )}
        {product.promo_price != null && product.promo_price < product.price && (
          <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-medium px-2 py-0.5 rounded-full">PROMO</span>
        )}
        {product.is_featured && (
          <span className="absolute top-2 right-2 text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: store.primary_color }}>DESTAQUE</span>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm mb-1" style={{
          fontFamily: titleFamily, fontWeight: titleWeight,
          color: store.title_color, textTransform: transform,
        }}>{product.name}</div>
        {product.description && (
          <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</div>
        )}
        {product.delivery_time && (
          <div className={`flex items-center gap-1 text-[11px] text-muted-foreground mb-3 ${align === 'center' ? 'justify-center' : ''}`}>
            <Clock className="w-3 h-3" /> {product.delivery_time}
          </div>
        )}
        <div className="mb-3">
          {hasVariants && <div className="text-[10px] text-muted-foreground">a partir de</div>}
          <div className={`flex items-baseline gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
            <div className="font-bold text-base" style={{ color: store.price_color }}>{formatBRL(minPrice)}</div>
            {!hasVariants && product.promo_price != null && product.promo_price < product.price && (
              <div className="text-xs text-muted-foreground line-through">{formatBRL(product.price)}</div>
            )}
          </div>
        </div>

        {showButton && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium border"
            style={{ background: store.button_bg_color, color: store.button_text_color, borderRadius: buttonRadius, borderColor: store.button_bg_color }}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Comprar
          </button>
        )}
      </div>
    </div>
  );
};

export default CatalogoPublico;
