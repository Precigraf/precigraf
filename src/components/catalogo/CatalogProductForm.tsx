import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCatalogCategories,
  useCatalogProducts,
  uploadCatalogImage,
  saveProductImages,
  replaceVariants,
  type CatalogProduct,
  type CatalogVariant,
} from '@/hooks/useCatalogProducts';
import { compressImage } from '@/lib/imageCompress';
import VariationsModal, { type VariationData } from './variations/VariationsModal';
import VariantPricingTable, { type VariantRow } from './variations/VariantPricingTable';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: CatalogProduct | null;
}

interface ImageItem {
  url: string;
  storage_path: string | null;
}

export const CatalogProductForm: React.FC<Props> = ({ open, onOpenChange, product }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCatalogCategories();
  const { create, update } = useCatalogProducts();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [promoPrice, setPromoPrice] = useState('');
  const [stock, setStock] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [variation, setVariation] = useState<VariationData | null>(null);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [variationsOpen, setVariationsOpen] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setPrice(product.price ? String(product.price) : '');
      setDescription(product.description ?? '');
      setCategoryId(product.category_id);
      setPromoPrice(product.promo_price ? String(product.promo_price) : '');
      setStock(product.stock != null ? String(product.stock) : '');
      setDeliveryTime(product.delivery_time ?? '');
      setDeliveryNotes(product.delivery_notes ?? '');
      setFeatured(product.is_featured);
      const vs = product.variants ?? [];
      const label = product.variation_label ?? '';
      if (label && vs.length > 0) {
        setVariation({ label, options: vs.map((v) => v.name) });
        setVariantRows(
          vs.map((v: CatalogVariant) => ({
            id: v.id,
            name: v.name,
            price: v.price ? String(v.price) : '',
            promo_price: v.promo_price ? String(v.promo_price) : '',
            is_active: v.is_active,
            stock_type: v.stock_type,
            stock: v.stock != null ? String(v.stock) : '',
          })),
        );
      } else {
        setVariation(null);
        setVariantRows([]);
      }
      setImages((product.images ?? []).map((i) => ({ url: i.url, storage_path: i.storage_path })));
    } else {
      setName(''); setPrice(''); setDescription(''); setCategoryId(null);
      setPromoPrice(''); setStock(''); setDeliveryTime(''); setDeliveryNotes('');
      setVariation(null); setVariantRows([]); setImages([]); setFeatured(false);
    }
  }, [open, product]);

  // Categories with children indented
  const orderedCats = (() => {
    const parents = categories.filter((c) => !c.parent_id);
    const result: Array<{ id: string; label: string }> = [];
    parents.forEach((p) => {
      result.push({ id: p.id, label: p.name });
      categories.filter((c) => c.parent_id === p.id).forEach((s) =>
        result.push({ id: s.id, label: `  ↳ ${s.name}` }),
      );
    });
    return result;
  })();

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = 5 - images.length;
    if (remaining <= 0) {
      toast({ title: 'Máximo de 5 imagens atingido', variant: 'destructive' });
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MAX = 8 * 1024 * 1024;
    setUploading(true);
    try {
      const tempProductId = product?.id ?? 'tmp';
      const arr = Array.from(files).slice(0, remaining);
      const uploaded: ImageItem[] = [];
      for (const f of arr) {
        if (!allowed.includes(f.type)) {
          toast({ title: `Formato inválido: ${f.name}`, description: 'Use JPG, PNG ou WebP.', variant: 'destructive' });
          continue;
        }
        if (f.size > MAX) {
          toast({ title: `Arquivo muito grande: ${f.name}`, description: 'Máximo 8 MB.', variant: 'destructive' });
          continue;
        }
        const compressedBlob = await compressImage(f, 1080, 0.88);
        const compressed = new File([compressedBlob], f.name, { type: compressedBlob.type || f.type });
        const { url, storage_path } = await uploadCatalogImage(user.id, tempProductId, compressed);
        uploaded.push({ url, storage_path });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      toast({ title: 'Falha no upload', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    setImages((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };


  // Quando a variação muda (nova opção, remoção, renomeação), reconcilia variantRows preservando preço/estoque/ativo existentes
  const handleVariationChange = (next: VariationData | null) => {
    if (!next) {
      setVariation(null);
      setVariantRows([]);
      return;
    }
    setVariation(next);
    setVariantRows((prev) => {
      const byName = new Map(prev.map((r) => [r.name, r]));
      return next.options.map((opt, idx) => {
        const existing = byName.get(opt) ?? prev[idx];
        return (
          existing ?? {
            name: opt,
            price: '',
            promo_price: '',
            is_active: true,
            stock_type: 'infinite' as const,
            stock: '',
          }
        );
      }).map((row, idx) => ({ ...row, name: next.options[idx] }));
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<CatalogProduct> = {
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price.replace(',', '.')) || 0,
        promo_price: promoPrice ? parseFloat(promoPrice.replace(',', '.')) : null,
        stock: stock ? parseInt(stock) : null,
        delivery_time: deliveryTime.trim() || null,
        delivery_notes: deliveryNotes.trim() || null,
        category_id: categoryId,
        is_featured: featured,
        variation_label: variation?.label ?? null,
      };

      let productId = product?.id;
      if (product) {
        await update.mutateAsync({ id: product.id, ...payload });
      } else {
        const created = await create.mutateAsync(payload);
        productId = (created as any).id;
      }
      if (!productId) throw new Error('Sem id');

      const cleanVariants = variantRows
        .filter((v) => v.name.trim())
        .map((v) => {
          const promo = v.promo_price ? parseFloat(v.promo_price.replace(',', '.')) : null;
          const priceN = parseFloat(v.price.replace(',', '.')) || 0;
          return {
            name: v.name.trim(),
            price: priceN,
            promo_price: promo && promo > 0 && promo < priceN ? promo : null,
            stock: v.stock_type === 'limited' ? (parseInt(v.stock) || 0) : null,
            stock_type: v.stock_type,
            is_active: v.is_active,
          };
        });
      await replaceVariants(user.id, productId, cleanVariants);
      await saveProductImages(user.id, productId, images);

      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] flex flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-destructive hover:underline font-medium"
          >
            Cancelar
          </button>
          <h2 className="font-semibold text-foreground text-sm">
            {product ? 'Editar produto' : 'Adicionar produto'}
          </h2>
          <button
            onClick={() => setFeatured((v) => !v)}
            className={`text-sm font-medium flex items-center gap-1 ${
              featured ? 'text-amber-500' : 'text-primary'
            } hover:underline`}
          >
            <Star className={`w-3.5 h-3.5 ${featured ? 'fill-current' : ''}`} />
            {featured ? 'Destacado' : 'Destacar'}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Camiseta preta"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="pl-9 text-right"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <div className="relative">
              <Textarea
                rows={3}
                maxLength={10000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Camiseta preta de algodão. Tamanhos P, M e G."
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                {description.length}/10000
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select value={categoryId ?? 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Ex: Camisetas, calças, meias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {orderedCats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 max-w-[200px]">
            <Label className="text-xs">Preço promocional</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="0,00"
                className="pl-9"
                inputMode="decimal"
              />
            </div>
          </div>

          <Accordion type="multiple" className="border-t border-border">
            <AccordionItem value="stock">
              <AccordionTrigger className="text-sm">
                Estoque <span className="text-muted-foreground font-normal ml-1">(Opcional)</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-w-[200px]">
                  <Input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="Quantidade em estoque"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Variações — fora do accordion para ficar sempre visível */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  Variações <span className="text-muted-foreground font-normal">(Opcional)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Exemplo: Cor, tamanho, etc</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariationsOpen(true)}
                className="text-primary border-primary/40 hover:bg-primary/10"
              >
                Editar variações
              </Button>
            </div>

            {variation && variantRows.length > 0 && (
              <VariantPricingTable
                label={variation.label}
                rows={variantRows}
                onChange={setVariantRows}
              />
            )}
          </div>

          <Accordion type="multiple" className="border-t border-border">

            <AccordionItem value="delivery">
              <AccordionTrigger className="text-sm">
                Entrega <span className="text-muted-foreground font-normal ml-1">(Opcional)</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Prazo de produção/entrega</Label>
                  <Input
                    placeholder="Ex: 3 a 5 dias úteis"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Observações</Label>
                  <Textarea
                    rows={2}
                    placeholder="Ex: Envio via Sedex/PAC após aprovação"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Image previews */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Recomendado 1080×1080 px (JPG, PNG ou WebP, até 8 MB). Máx. 5 imagens.
            </p>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-0.5 left-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                      {i + 1}/{images.length}
                    </span>
                    <button
                      onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => moveImage(i, -1)} disabled={i === 0} className="text-white text-xs px-1 disabled:opacity-30">◀</button>
                      <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="text-white text-xs px-1 disabled:opacity-30">▶</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ''; }}
              disabled={uploading || images.length >= 5}
            />
            <div className={`w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 ${uploading || images.length >= 5 ? 'opacity-50' : ''}`}>
              <ImagePlus className="w-5 h-5" />
            </div>
          </label>
          <Button onClick={handleSubmit} disabled={saving || uploading} className="px-8">
            {saving ? 'Salvando...' : product ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </DialogContent>

      <VariationsModal
        open={variationsOpen}
        onOpenChange={setVariationsOpen}
        value={variation}
        onSave={handleVariationChange}
      />
    </Dialog>
  );
};
