import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Package, Clock, X } from 'lucide-react';
import type { PublicCatalogData, PublicCatalogStore } from '@/hooks/useCatalog';

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const radiusFor = (style?: string) => {
  if (style === 'pill') return '9999px';
  if (style === 'straight') return '0px';
  return '12px';
};

export interface CartLine {
  key: string;
  product_id: string;
  product_name: string;
  variant_name: string | null;
  image: string | null;
  qty: number;
  unit_price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: PublicCatalogData['products'][number] | null;
  store: PublicCatalogStore;
  onAdd: (line: CartLine) => void;
  onBuyNow?: (line: CartLine) => void;
}

export const ProductDetailModal: React.FC<Props> = ({ open, onOpenChange, product, store, onAdd, onBuyNow }) => {
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (open) { setVariantIdx(0); setQty(1); setImgIdx(0); }
  }, [open, product?.id]);

  const buttonRadius = radiusFor(store.button_border_style);
  const titleFamily = `'${store.title_font}', sans-serif`;
  const titleWeight = store.title_weight === 'light' ? 300 : store.title_weight === 'medium' ? 500 : 700;

  const variants = (product?.variants ?? []).filter((v: any) => v.is_active !== false);
  const hasVariants = variants.length > 0;

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    if (hasVariants) {
      const v: any = variants[variantIdx];
      if (!v) return product.price;
      return v.promo_price && v.promo_price > 0 && v.promo_price < v.price ? v.promo_price : v.price;
    }
    return product.promo_price ?? product.price;
  }, [product, hasVariants, variantIdx, variants]);

  if (!product) return null;
  const images = product.images?.length ? product.images : [];
  const mainImage = images[imgIdx] ?? null;

  const buildLine = (): CartLine => ({
    key: `${product.id}-${hasVariants ? variants[variantIdx].id : 'base'}-${Date.now()}`,
    product_id: product.id,
    product_name: product.name,
    variant_name: hasVariants ? variants[variantIdx].name : null,
    image: mainImage,
    qty,
    unit_price: unitPrice,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="grid md:grid-cols-[1.1fr_1fr] flex-1 overflow-hidden">
          {/* Gallery */}
          <div className="bg-muted/40 flex flex-col p-3 gap-2 overflow-hidden">
            <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden bg-background min-h-[260px] md:min-h-[400px]">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <Package className="w-16 h-16 text-muted-foreground/40" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setImgIdx(i)}
                    className={`w-14 h-14 shrink-0 rounded-md overflow-hidden border-2 ${
                      i === imgIdx ? 'border-primary' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
            <div>
              <h2
                className="text-xl sm:text-2xl mb-2"
                style={{ fontFamily: titleFamily, fontWeight: titleWeight, color: store.title_color }}
              >
                {product.name}
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold" style={{ color: store.price_color }}>
                  {formatBRL(unitPrice)}
                </span>
                {!hasVariants && product.promo_price != null && product.promo_price < product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBRL(product.price)}
                  </span>
                )}
              </div>
              {product.delivery_time && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" /> {product.delivery_time}
                </div>
              )}
            </div>

            {hasVariants && (
              <div>
                <div className="text-sm font-medium mb-2">Escolha uma opção</div>
                <div className="grid grid-cols-1 gap-2">
                  {variants.map((v: any, i) => {
                    const sel = i === variantIdx;
                    const out = v.stock_type === 'limited' && (v.stock ?? 0) <= 0;
                    const variantPrice = v.promo_price && v.promo_price > 0 && v.promo_price < v.price ? v.promo_price : v.price;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={out}
                        onClick={() => setVariantIdx(i)}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition ${
                          sel ? 'border-2' : 'border-border hover:border-foreground/30'
                        } ${out ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={sel ? { borderColor: store.primary_color, background: `${store.primary_color}10` } : {}}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0`}
                            style={{ borderColor: sel ? store.primary_color : 'hsl(var(--border))' }}>
                            {sel && <span className="w-2 h-2 rounded-full" style={{ background: store.primary_color }} />}
                          </span>
                          <span className="text-sm truncate">{v.name}</span>
                          {out && <span className="text-[10px] text-destructive">esgotado</span>}
                          {v.stock_type === 'limited' && v.stock > 0 && v.stock <= 5 && (
                            <span className="text-[10px] text-muted-foreground">({v.stock} disp.)</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-sm font-semibold" style={{ color: store.price_color }}>
                            {formatBRL(variantPrice)}
                          </span>
                          {variantPrice < v.price && (
                            <span className="text-[10px] text-muted-foreground line-through">{formatBRL(v.price)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium mb-2">Quantidade</div>
              <div className="inline-flex items-center border border-border rounded-full">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-l-full"
                  aria-label="Diminuir"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-r-full"
                  aria-label="Aumentar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {product.description && (
              <div className="border-t border-border pt-4">
                <div className="text-sm font-semibold mb-2">Descrição</div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer CTA */}
        <div className="border-t border-border bg-background p-3 sm:p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground">Total</div>
            <div className="text-lg font-bold truncate" style={{ color: store.price_color }}>
              {formatBRL(unitPrice * qty)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onAdd(buildLine()); onOpenChange(false); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium"
            style={{
              background: store.button_bg_color,
              color: store.button_text_color,
              borderRadius: buttonRadius,
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar ao carrinho
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
