import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Search, ShoppingCart, Tag, Clock, Check, X, MessageCircle, Trash2, Package } from 'lucide-react';
import { usePublicCatalog, type PublicCatalogData } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CartItem {
  key: string;
  product_id: string;
  product_name: string;
  qty_label: string;
  price: number;
}

const CatalogoPublico: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = usePublicCatalog(slug);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const primary = data?.store.primary_color ?? '#534AB7';

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      if (filterCat && p.category_id !== filterCat) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, filterCat, search]);

  const total = cart.reduce((s, i) => s + i.price, 0);

  const addToCart = (item: CartItem) => {
    setCart((c) => [...c, item]);
    setOpenDrop(null);
  };
  const removeFromCart = (key: string) => setCart((c) => c.filter((i) => i.key !== key));

  const finalizeWhatsApp = () => {
    if (!data || cart.length === 0) return;
    const phone = (data.store.whatsapp ?? '').replace(/\D/g, '');
    if (!phone) {
      alert('Loja sem WhatsApp configurado.');
      return;
    }
    const itensTxt = cart
      .map((i) => `• ${i.product_name} — ${i.qty_label} — ${formatBRL(i.price)}`)
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

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3 p-6 text-center">
        <Package className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Catálogo não encontrado</h1>
        <p className="text-sm text-muted-foreground">Verifique o link com a gráfica.</p>
      </div>
    );
  }

  const banners = data.banners;
  const currentBanner = banners[bannerIdx];

  return (
    <div className="min-h-screen bg-muted/30" style={{ ['--catalog-primary' as any]: primary }}>
      {/* Navbar */}
      <header className="bg-background border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {data.store.logo_url ? (
              <img src={data.store.logo_url} alt={data.store.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: primary }}>
                <Package className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-foreground truncate">{data.store.name}</span>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="rounded-full text-white" style={{ background: primary }}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Carrinho
                {cart.length > 0 && (
                  <span className="ml-2 bg-white/25 rounded-full px-2 text-xs">{cart.length}</span>
                )}
              </Button>
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
                    <div key={item.key} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.product_name}</div>
                        <div className="text-xs text-muted-foreground">{item.qty_label}</div>
                      </div>
                      <div className="font-semibold text-sm" style={{ color: primary }}>
                        {formatBRL(item.price)}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.key)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
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
                  <Button
                    className="w-full bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white"
                    size="lg"
                    onClick={finalizeWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Finalizar pelo WhatsApp
                  </Button>
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
        {/* Banner */}
        {currentBanner && (
          <div
            className="relative overflow-hidden flex items-center"
            style={{ background: currentBanner.bg_color, minHeight: 180 }}
          >
            <div className="px-6 py-8 sm:px-12 text-white max-w-2xl">
              {currentBanner.eyebrow && (
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 mb-2">
                  {currentBanner.eyebrow}
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">{currentBanner.title}</h2>
              {currentBanner.subtitle && <p className="text-sm opacity-90 mb-4">{currentBanner.subtitle}</p>}
              {currentBanner.cta_label && currentBanner.cta_url && (
                <a
                  href={currentBanner.cta_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-medium"
                >
                  {currentBanner.cta_label}
                </a>
              )}
            </div>
            {banners.length > 1 && (
              <div className="absolute bottom-3 right-4 flex gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIdx(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === bannerIdx ? 18 : 6,
                      background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-background border-b border-border px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCat(null)}
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                !filterCat ? 'text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              style={!filterCat ? { background: primary } : {}}
            >
              Todos
            </button>
            {data.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`px-3 py-1.5 text-sm rounded-full transition ${
                  filterCat === c.id ? 'text-white' : 'text-muted-foreground hover:bg-muted'
                }`}
                style={filterCat === c.id ? { background: primary } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-9 h-9 rounded-full"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">Nenhum produto encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  primary={primary}
                  isOpen={openDrop === p.id}
                  onToggle={() => setOpenDrop(openDrop === p.id ? null : p.id)}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
          Pedido enviado pelo WhatsApp diretamente para {data.store.name}.
        </footer>
      </div>
    </div>
  );
};

interface PCardProps {
  product: PublicCatalogData['products'][number];
  primary: string;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (i: CartItem) => void;
}

const ProductCard: React.FC<PCardProps> = ({ product, primary, isOpen, onToggle, onAdd }) => {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const basePrice = product.promo_price ?? product.price;
  const minPrice = hasVariants ? Math.min(...variants.map((v) => v.price)) : basePrice;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const thumb = product.images?.[0];

  const handleAdd = () => {
    if (hasVariants) {
      const v = variants[selectedIdx];
      onAdd({
        key: `${product.id}-${Date.now()}`,
        product_id: product.id,
        product_name: `${product.name} — ${v.name}`,
        qty_label: '1 un',
        price: v.price,
      });
    } else {
      onAdd({
        key: `${product.id}-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        qty_label: '1 un',
        price: basePrice,
      });
    }
  };

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden hover:border-muted-foreground/30 transition">
      <div className="h-36 bg-muted/40 border-b border-border flex items-center justify-center relative overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground/50" />
        )}
        {product.promo_price != null && product.promo_price < product.price && (
          <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            PROMO
          </span>
        )}
        {product.is_featured && (
          <span
            className="absolute top-2 right-2 text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: primary }}
          >
            DESTAQUE
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="font-semibold text-sm text-foreground mb-1">{product.name}</div>
        {product.description && (
          <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</div>
        )}
        {product.delivery_time && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
            <Clock className="w-3 h-3" /> {product.delivery_time}
          </div>
        )}
        <div className="mb-3">
          {hasVariants && <div className="text-[10px] text-muted-foreground">a partir de</div>}
          <div className="flex items-baseline gap-2">
            <div className="font-bold text-base" style={{ color: primary }}>
              {formatBRL(minPrice)}
            </div>
            {!hasVariants && product.promo_price != null && product.promo_price < product.price && (
              <div className="text-xs text-muted-foreground line-through">{formatBRL(product.price)}</div>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={hasVariants ? onToggle : handleAdd}
        >
          {hasVariants ? (
            <>
              <Tag className="w-3.5 h-3.5 mr-1.5" />
              Variações
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Adicionar
            </>
          )}
        </Button>

        {hasVariants && isOpen && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden">
            {variants.map((v, i) => {
              const sel = selectedIdx === i;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm text-left border-t border-border first:border-t-0 ${
                    sel ? 'bg-muted/60' : 'hover:bg-muted/30'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        sel ? 'border-transparent text-white' : 'border-border'
                      }`}
                      style={sel ? { background: primary } : {}}
                    >
                      {sel && <Check className="w-2.5 h-2.5" />}
                    </span>
                    {v.name}
                  </span>
                  <span>{formatBRL(v.price)}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAdd}
              className="w-full px-3 py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2"
              style={{ background: primary }}
            >
              <ShoppingCart className="w-4 h-4" />
              Adicionar · {formatBRL(variants[selectedIdx].price)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogoPublico;
