import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Boxes } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useInventory } from '@/hooks/useInventory';
import { useProductMaterials, type ProductMaterialInput } from '@/hooks/useProductMaterials';
import type { Product, ProductInput } from '@/hooks/useProducts';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductInput, materials: ProductMaterialInput[]) => void;
  initialData?: Product | null;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ open, onOpenChange, onSubmit, initialData, isLoading }) => {
  const { categories } = useCategories();
  const { materials: inventoryMaterials } = useInventory();
  const { productMaterials } = useProductMaterials(initialData?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [printType, setPrintType] = useState('');
  const [material, setMaterial] = useState('');
  const [finish, setFinish] = useState('');
  const [productionTime, setProductionTime] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [composition, setComposition] = useState<ProductMaterialInput[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSize(initialData.size || '');
      setPrintType(initialData.print_type || '');
      setMaterial(initialData.material || '');
      setFinish(initialData.finish || '');
      setProductionTime(initialData.production_time || '');
      const tier = initialData.price_tiers?.[0];
      setQuantity(String(tier?.quantity ?? initialData.default_quantity ?? ''));
      setPrice(String(tier?.price ?? initialData.unit_price ?? ''));
      setCost(String(tier?.cost ?? initialData.cost ?? ''));
      setIsActive(initialData.is_active ?? true);
      setCategoryId(initialData.category_id ?? null);
    } else {
      setName(''); setDescription(''); setSize(''); setPrintType('');
      setMaterial(''); setFinish(''); setProductionTime('');
      setQuantity(''); setPrice(''); setCost(''); setIsActive(true);
      setCategoryId(null);
      setComposition([]);
    }
  }, [initialData, open]);

  // Sync composition from loaded productMaterials
  useEffect(() => {
    if (initialData && productMaterials.length > 0) {
      setComposition(productMaterials.map(pm => ({
        material_id: pm.material_id,
        quantity_per_unit: pm.quantity_per_unit,
      })));
    } else if (initialData) {
      setComposition([]);
    }
  }, [initialData, productMaterials]);

  const addMaterialRow = () => {
    if (inventoryMaterials.length === 0) return;
    const used = new Set(composition.map(c => c.material_id));
    const available = inventoryMaterials.find(m => !used.has(m.id));
    if (!available) return;
    setComposition(prev => [...prev, { material_id: available.id, quantity_per_unit: 1 }]);
  };

  const updateRow = (idx: number, patch: Partial<ProductMaterialInput>) => {
    setComposition(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const removeRow = (idx: number) => setComposition(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const priceNum = parseFloat(price.replace(',', '.')) || 0;
    const costNum = parseFloat(cost.replace(',', '.')) || 0;
    const validComposition = composition.filter(c => c.material_id && c.quantity_per_unit > 0);
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      size: size.trim() || null,
      print_type: printType.trim() || null,
      material: material.trim() || null,
      finish: finish.trim() || null,
      production_time: productionTime.trim() || null,
      unit_price: priceNum,
      cost: costNum,
      default_quantity: qty,
      is_active: isActive,
      price_tiers: [{ quantity: qty, price: priceNum, cost: costNum }],
      category_id: categoryId,
    }, validComposition);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Input value={size} onChange={e => setSize(e.target.value)} maxLength={50} placeholder="Ex: 11x9x3,5cm, A4, etc." />
            </div>
            <div className="space-y-2">
              <Label>Impressão</Label>
              <Input value={printType} onChange={e => setPrintType(e.target.value)} maxLength={50} placeholder="Ex: Colorido, P&B" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <Label className="text-base">Preços por Quantidade *</Label>
              <p className="text-xs text-muted-foreground">Define preços e quantidades para diferentes quantidades</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium px-1">
              <div>Quantidade</div>
              <div>Preço de Venda (R$)</div>
              <div>Custo (R$)</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Ex: 100" required />
              <Input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" required />
              <Input type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          {/* Materiais utilizados */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base flex items-center gap-2"><Boxes className="w-4 h-4" /> Materiais Utilizados</Label>
                <p className="text-xs text-muted-foreground">Insumos do estoque consumidos por unidade. Será abatido ao aprovar pedidos.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addMaterialRow} disabled={inventoryMaterials.length === 0 || composition.length >= inventoryMaterials.length}>
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            </div>
            {inventoryMaterials.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Cadastre materiais em Estoque para vincular aqui.</p>
            ) : composition.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum material vinculado.</p>
            ) : (
              <div className="space-y-2">
                {composition.map((row, idx) => {
                  const mat = inventoryMaterials.find(m => m.id === row.material_id);
                  const usedIds = new Set(composition.filter((_, i) => i !== idx).map(c => c.material_id));
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 rounded-md bg-muted/30 border border-border">
                      <div className="col-span-7">
                        <Label className="text-xs">Material</Label>
                        <Select value={row.material_id} onValueChange={v => updateRow(idx, { material_id: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {inventoryMaterials.filter(m => m.id === row.material_id || !usedIds.has(m.id)).map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Qtd / unidade ({mat?.unit || ''})</Label>
                        <Input type="number" step="any" min="0" value={row.quantity_per_unit} onChange={e => updateRow(idx, { quantity_per_unit: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(idx)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="cursor-pointer">Produto ativo</Label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
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
