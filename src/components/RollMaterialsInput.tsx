import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Calculator, Scissors } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TooltipLabel from './TooltipLabel';

export interface RollMaterialItem {
  id: string;
  name: string;
  rollValue: number;        // R$
  rollLengthM: number;      // metros
  rollWidthCm: number;      // cm
  pieceWidthCm: number;     // cm
  pieceHeightCm: number;    // cm
  piecesPerProduct: number;
  lossPercentage: number;   // 0-100
}

export interface RollMaterialCalc {
  rollLengthCm: number;
  rollAreaCm2: number;
  pieceAreaCm2: number;
  piecesPerRow: number;
  totalRows: number;
  totalPieces: number;
  bestOrientation: 1 | 2 | null;
  totalPiecesWithLoss: number;
  costPerPiece: number;
  costPerProduct: number;
}

export const calculateRollMaterial = (item: RollMaterialItem): RollMaterialCalc => {
  const rollLengthCm = (item.rollLengthM || 0) * 100;
  const rollWidthCm = item.rollWidthCm || 0;
  const pw = item.pieceWidthCm || 0;
  const ph = item.pieceHeightCm || 0;

  const rollAreaCm2 = rollLengthCm * rollWidthCm;
  const pieceAreaCm2 = pw * ph;

  const empty: RollMaterialCalc = {
    rollLengthCm,
    rollAreaCm2,
    pieceAreaCm2,
    piecesPerRow: 0,
    totalRows: 0,
    totalPieces: 0,
    bestOrientation: null,
    totalPiecesWithLoss: 0,
    costPerPiece: 0,
    costPerProduct: 0,
  };

  if (rollLengthCm <= 0 || rollWidthCm <= 0 || pw <= 0 || ph <= 0) return empty;

  const piecesPerRow1 = Math.floor(rollWidthCm / pw);
  const rows1 = Math.floor(rollLengthCm / ph);
  const total1 = piecesPerRow1 * rows1;

  const piecesPerRow2 = Math.floor(rollWidthCm / ph);
  const rows2 = Math.floor(rollLengthCm / pw);
  const total2 = piecesPerRow2 * rows2;

  const useOrientation2 = total2 > total1;
  const totalPieces = useOrientation2 ? total2 : total1;
  const piecesPerRow = useOrientation2 ? piecesPerRow2 : piecesPerRow1;
  const totalRows = useOrientation2 ? rows2 : rows1;
  const bestOrientation: 1 | 2 = useOrientation2 ? 2 : 1;

  const lossPct = Math.min(Math.max(item.lossPercentage || 0, 0), 99);
  const totalPiecesWithLoss = totalPieces * (1 - lossPct / 100);

  const costPerPiece = totalPiecesWithLoss > 0 ? item.rollValue / totalPiecesWithLoss : 0;
  const qty = item.piecesPerProduct > 0 ? item.piecesPerProduct : 0;
  const costPerProduct = costPerPiece * qty;

  return {
    rollLengthCm,
    rollAreaCm2,
    pieceAreaCm2,
    piecesPerRow,
    totalRows,
    totalPieces,
    bestOrientation,
    totalPiecesWithLoss,
    costPerPiece,
    costPerProduct,
  };
};

export const calculateRollMaterialItemCost = (item: RollMaterialItem): number => {
  return calculateRollMaterial(item).costPerProduct;
};

interface RollMaterialsInputProps {
  items: RollMaterialItem[];
  onItemsChange: (items: RollMaterialItem[]) => void;
  disabled?: boolean;
}

const formatCurrency = (num: number): string => {
  if (!Number.isFinite(num) || isNaN(num)) return '0,00';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumber = (num: number, digits = 2): string => {
  if (!Number.isFinite(num) || isNaN(num)) return '0';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits });
};

const RollMaterialsInput: React.FC<RollMaterialsInputProps> = ({ items, onItemsChange, disabled = false }) => {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    if (cleaned.length > 12) return 999999999.99;
    const num = parseInt(cleaned, 10) || 0;
    return Math.min(num / 100, 999999999.99);
  };

  const handleAdd = () => {
    const newItem: RollMaterialItem = {
      id: `roll-${Date.now()}`,
      name: '',
      rollValue: 0,
      rollLengthM: 0,
      rollWidthCm: 0,
      pieceWidthCm: 0,
      pieceHeightCm: 0,
      piecesPerProduct: 1,
      lossPercentage: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemove = (id: string) => {
    onItemsChange(items.filter(i => i.id !== id));
    setDisplayValues(prev => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const updateItem = useCallback((id: string, patch: Partial<RollMaterialItem>) => {
    onItemsChange(items.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }, [items, onItemsChange]);

  const handleNameChange = (id: string, name: string) => updateItem(id, { name: name.slice(0, 80) });

  const handleRollValueChange = (id: string, raw: string) => {
    const v = parseCurrency(raw);
    setDisplayValues(prev => ({ ...prev, [id]: formatCurrency(v) }));
    updateItem(id, { rollValue: v });
  };

  const handleNumberChange = (
    id: string,
    field: keyof RollMaterialItem,
    raw: string,
    max: number,
    fallback = 0
  ) => {
    if (raw === '') {
      updateItem(id, { [field]: fallback } as Partial<RollMaterialItem>);
      return;
    }
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      updateItem(id, { [field]: Math.min(parsed, max) } as Partial<RollMaterialItem>);
    }
  };

  const getRollDisplay = (item: RollMaterialItem): string => {
    if (displayValues[item.id] !== undefined) return displayValues[item.id];
    if (item.rollValue === 0) return '';
    return formatCurrency(item.rollValue);
  };

  const totalCost = useMemo(
    () => items.reduce((sum, i) => sum + calculateRollMaterialItemCost(i), 0),
    [items]
  );

  return (
    <div className="col-span-full space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between gap-2">
        <TooltipLabel
          label="Material por rolo / área"
          tooltip="Para materiais vendidos em rolo (tecido, adesivo, vinil, manta, EVA, papel em bobina, etc). Calcula custo por peça com base no aproveitamento real do corte."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || items.length >= 10}
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar material por rolo
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const calc = calculateRollMaterial(item);
            const ready = calc.totalPieces > 0;

            return (
              <div key={item.id} className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3">
                {/* Nome + remover */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Nome do material</label>
                    <Input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleNameChange(item.id, e.target.value)}
                      placeholder="Ex: Vinil adesivo brilho 30cm"
                      disabled={disabled}
                      className="h-9 text-sm mt-1"
                      maxLength={80}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                    disabled={disabled}
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-4"
                    aria-label="Remover material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Dados do rolo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Valor total do rolo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={getRollDisplay(item)}
                        onChange={(e) => handleRollValueChange(item.id, e.target.value)}
                        placeholder="0,00"
                        disabled={disabled}
                        className="input-currency w-full pl-10 text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Comprimento (m)</label>
                    <Input
                      type="number"
                      value={item.rollLengthM || ''}
                      onChange={(e) => handleNumberChange(item.id, 'rollLengthM', e.target.value, 100000)}
                      placeholder="Ex: 20"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      step="0.01"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Largura do rolo (cm)</label>
                    <Input
                      type="number"
                      value={item.rollWidthCm || ''}
                      onChange={(e) => handleNumberChange(item.id, 'rollWidthCm', e.target.value, 100000)}
                      placeholder="Ex: 30"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Dados do corte */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Largura peça (cm)</label>
                    <Input
                      type="number"
                      value={item.pieceWidthCm || ''}
                      onChange={(e) => handleNumberChange(item.id, 'pieceWidthCm', e.target.value, 100000)}
                      placeholder="Ex: 8"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      step="0.1"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Altura peça (cm)</label>
                    <Input
                      type="number"
                      value={item.pieceHeightCm || ''}
                      onChange={(e) => handleNumberChange(item.id, 'pieceHeightCm', e.target.value, 100000)}
                      placeholder="Ex: 5"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      step="0.1"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Peças por produto</label>
                    <Input
                      type="number"
                      value={item.piecesPerProduct || ''}
                      onChange={(e) => handleNumberChange(item.id, 'piecesPerProduct', e.target.value, 99999, 1)}
                      placeholder="Ex: 2"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      step="1"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Perda (%)</label>
                    <Input
                      type="number"
                      value={item.lossPercentage || ''}
                      onChange={(e) => handleNumberChange(item.id, 'lossPercentage', e.target.value, 99)}
                      placeholder="0"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      max={99}
                      step="0.5"
                    />
                  </div>
                </div>

                {/* Resultado */}
                {ready && (
                  <div className="rounded-md border border-border/40 bg-muted/40 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Scissors className="w-3.5 h-3.5 text-primary" />
                      Aproveitamento do corte
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Área total do rolo:</span>
                        <span className="font-medium">{formatNumber(calc.rollAreaCm2, 0)} cm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Área da peça:</span>
                        <span className="font-medium">{formatNumber(calc.pieceAreaCm2, 2)} cm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Melhor orientação:</span>
                        <span className="font-medium">
                          {calc.bestOrientation === 2 ? 'Peça rotacionada' : 'Padrão'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peças por fileira:</span>
                        <span className="font-medium">{calc.piecesPerRow} × {calc.totalRows} fileiras</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total aproveitável:</span>
                        <span className="font-medium">
                          {formatNumber(calc.totalPiecesWithLoss, 0)} peças
                          {item.lossPercentage > 0 && (
                            <span className="text-muted-foreground"> (bruto {calc.totalPieces})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custo por peça:</span>
                        <span className="font-medium">R$ {formatCurrency(calc.costPerPiece)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Calculator className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Custo no produto ({item.piecesPerProduct || 0} peça{(item.piecesPerProduct || 0) === 1 ? '' : 's'}):
                        </span>
                      </div>
                      <span className="font-semibold text-primary text-sm">
                        R$ {formatCurrency(calc.costPerProduct)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {totalCost > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs">
                <Calculator className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Total materiais por rolo:</span>
              </div>
              <span className="font-semibold text-primary text-sm">
                R$ {formatCurrency(totalCost)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Adicione materiais vendidos em rolo: tecido, adesivo, vinil, manta, EVA, bobina de papel, acetato, etc.
        </p>
      )}
    </div>
  );
};

export default RollMaterialsInput;
