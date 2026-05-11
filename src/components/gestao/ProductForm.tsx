import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { useSupplyStock, useProductSupplies } from '@/hooks/useSupplyStock';
import type { Product, ProductInput, PriceTier } from '@/hooks/useProducts';

export interface SupplyLinkPayload {
  supply_id: string;
  quantity_per_unit: number;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductInput, supplies: SupplyLinkPayload[]) => void;
  initialData?: Product | null;
  isLoading?: boolean;
}

interface TierRow {
  id: string;
  quantity: string;
  price: string;
  cost: string;
}

interface SupplyRow {
  id: string;
  supply_id: string;
  quantity_per_unit: string;
}

const newRow = (): TierRow => ({ id: crypto.randomUUID(), quantity: '', price: '', cost: '' });
const newSupplyRow = (): SupplyRow => ({ id: crypto.randomUUID(), supply_id: '', quantity_per_unit: '' });

const ProductForm: React.FC<ProductFormProps> = ({ open, onOpenChange, onSubmit, initialData, isLoading }) => {
  const { categories } = useCategories();
  const { toast } = useToast();
  const { supplies } = useSupplyStock();
  const { links: existingLinks, save: saveLinks } = useProductSupplies(initialData?.id ?? null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [printType, setPrintType] = useState('');
  const [material, setMaterial] = useState('');
  const [finish, setFinish] = useState('');
  const [productionTime, setProductionTime] = useState('');
  const [tiers, setTiers] = useState<TierRow[]>([newRow()]);
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [supplyRows, setSupplyRows] = useState<SupplyRow[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSize(initialData.size || '');
      setPrintType(initialData.print_type || '');
      setMaterial(initialData.material || '');
      setFinish(initialData.finish || '');
      setProductionTime(initialData.production_time || '');
      setIsActive(initialData.is_active ?? true);
      setCategoryId(initialData.category_id ?? null);

      const existing = Array.isArray(initialData.price_tiers) ? initialData.price_tiers : [];
      if (existing.length > 0) {
        setTiers(existing.map((t) => ({
          id: crypto.randomUUID(),
          quantity: String(t.quantity ?? ''),
          price: String(t.price ?? ''),
          cost: String(t.cost ?? ''),
        })));
      } else {
        setTiers([{
          id: crypto.randomUUID(),
          quantity: String(initialData.default_quantity ?? ''),
          price: String(initialData.unit_price ?? ''),
          cost: String(initialData.cost ?? ''),
        }]);
      }
    } else {
      setName(''); setDescription(''); setSize(''); setPrintType('');
      setMaterial(''); setFinish(''); setProductionTime('');
      setIsActive(true); setCategoryId(null);
      setTiers([newRow()]);
      setSupplyRows([]);
    }
  }, [initialData, open]);

  useEffect(() => {
    if (initialData && existingLinks.length > 0) {
      setSupplyRows(existingLinks.map((l) => ({
        id: crypto.randomUUID(),
        supply_id: l.supply_id,
        quantity_per_unit: String(l.quantity_per_unit),
      })));
    } else if (initialData) {
      setSupplyRows([]);
    }
  }, [initialData, existingLinks.length]);

  const updateSupplyRow = (id: string, patch: Partial<SupplyRow>) => {
    setSupplyRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const addSupplyRow = () => setSupplyRows((prev) => [...prev, newSupplyRow()]);
  const removeSupplyRow = (id: string) => setSupplyRows((prev) => prev.filter((r) => r.id !== id));

  const updateTier = (id: string, patch: Partial<TierRow>) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addTier = () => setTiers((prev) => [...prev, newRow()]);
  const removeTier = (id: string) => setTiers((prev) => (prev.length > 1 ? prev.filter((t) => t.id !== id) : prev));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse and validate tiers
    const parsed: PriceTier[] = [];
    const seenQty = new Set<number>();
    for (const t of tiers) {
      const q = parseInt(t.quantity);
      const p = parseFloat(t.price.replace(',', '.'));
      const c = parseFloat(t.cost.replace(',', '.')) || 0;
      if (!q || q < 1) {
        toast({ title: 'Quantidade inválida', description: 'Cada variação precisa ter quantidade ≥ 1.', variant: 'destructive' });
        return;
      }
      if (!p || p <= 0) {
        toast({ title: 'Preço inválido', description: 'Cada variação precisa ter preço de venda > 0.', variant: 'destructive' });
        return;
      }
      if (seenQty.has(q)) {
        toast({ title: 'Quantidade duplicada', description: `A quantidade ${q} aparece em mais de uma variação.`, variant: 'destructive' });
        return;
      }
      seenQty.add(q);
      parsed.push({ quantity: q, price: p, cost: c });
    }

    if (parsed.length === 0) {
      toast({ title: 'Adicione pelo menos uma variação.', variant: 'destructive' });
      return;
    }

    // Sort by quantity ascending for consistent display
    parsed.sort((a, b) => a.quantity - b.quantity);
    const first = parsed[0];

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      size: size.trim() || null,
      print_type: printType.trim() || null,
      material: material.trim() || null,
      finish: finish.trim() || null,
      production_time: productionTime.trim() || null,
      unit_price: first.price,
      cost: first.cost,
      default_quantity: first.quantity,
      is_active: isActive,
      price_tiers: parsed,
      category_id: categoryId,
    });

    // Save supply links only when editing existing product
    if (initialData?.id) {
      const links = supplyRows
        .filter((r) => r.supply_id && parseFloat(r.quantity_per_unit.replace(',', '.')) > 0)
        .map((r) => ({ supply_id: r.supply_id, quantity_per_unit: parseFloat(r.quantity_per_unit.replace(',', '.')) }));
      saveLinks.mutate(links);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>Produtos são usados apenas em pedidos e orçamentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Produto *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required maxLength={150} placeholder="Nome do produto personalizado" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500} placeholder="Descrição livre do produto (tamanho, especificações, etc.)" />
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId ?? 'none'} onValueChange={v => setCategoryId(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Input value={size} onChange={e => setSize(e.target.value)} maxLength={50} placeholder="Ex: 11x9x3,5cm, A4, etc." />
            </div>
            <div className="space-y-2">
              <Label>Impressão</Label>
              <Input value={printType} onChange={e => setPrintType(e.target.value)} maxLength={50} placeholder="Ex: Colorido, P&B" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Papel/Material</Label>
              <Input value={material} onChange={e => setMaterial(e.target.value)} maxLength={100} placeholder="Ex: Papel offset 180g" />
            </div>
            <div className="space-y-2">
              <Label>Acabamento</Label>
              <Input value={finish} onChange={e => setFinish(e.target.value)} maxLength={100} placeholder="Ex: Laminação fosca" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prazo de Produção</Label>
            <Input value={productionTime} onChange={e => setProductionTime(e.target.value)} maxLength={50} placeholder="Ex: 6 a 8 dias úteis" />
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div>
              <Label className="text-base">Variações de Preço *</Label>
              <p className="text-xs text-muted-foreground">Cadastre diferentes faixas de quantidade com seus respectivos preços e custos. No orçamento, você poderá escolher qual usar.</p>
            </div>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-1">
              <div>Quantidade</div>
              <div>Preço de Venda (R$)</div>
              <div>Custo (R$)</div>
              <div className="w-9" />
            </div>
            <div className="space-y-3 sm:space-y-2">
              {tiers.map((t) => (
                <div key={t.id} className="rounded-lg border border-border p-3 sm:p-0 sm:border-0 sm:rounded-none grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <div className="space-y-1 sm:space-y-0">
                    <Label className="sm:hidden text-[11px] text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={t.quantity}
                      onChange={e => updateTier(t.id, { quantity: e.target.value })}
                      placeholder="Ex: 100"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-0">
                    <Label className="sm:hidden text-[11px] text-muted-foreground">Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={t.price}
                      onChange={e => updateTier(t.id, { price: e.target.value })}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-0">
                    <Label className="sm:hidden text-[11px] text-muted-foreground">Custo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={t.cost}
                      onChange={e => updateTier(t.id, { cost: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTier(t.id)}
                    disabled={tiers.length === 1}
                    title="Remover variação"
                    className="text-destructive hover:text-destructive disabled:opacity-30 justify-self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTier}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar variação
            </Button>
          </div>

          {initialData?.id && supplies.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div>
                <Label className="text-base">Insumos consumidos por unidade</Label>
                <p className="text-xs text-muted-foreground">Ao aprovar pedidos, o estoque destes insumos será descontado.</p>
              </div>
              <div className="space-y-2">
                {supplyRows.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_100px_auto] gap-2 items-center">
                    <Select value={row.supply_id} onValueChange={(v) => updateSupplyRow(row.id, { supply_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um insumo" /></SelectTrigger>
                      <SelectContent>
                        {supplies.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.unit})</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Input type="number" step="0.01" min="0" placeholder="Qtd/un" value={row.quantity_per_unit} onChange={(e) => updateSupplyRow(row.id, { quantity_per_unit: e.target.value })} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSupplyRow(row.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSupplyRow} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Adicionar insumo
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="cursor-pointer">Produto ativo</Label>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">Cancelar</Button>
              <Button type="submit" disabled={isLoading || !name.trim()} className="flex-1 sm:flex-none">
                {initialData ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
