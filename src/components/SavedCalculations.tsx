import React, { useState } from 'react';
import { Trash2, Eye, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalculations, Calculation } from '@/hooks/useCalculations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SavedCalculations: React.FC = () => {
  const { calculations, loading, deleteCalculation, remainingCalculations, canSaveMore } = useCalculations();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingCalc, setViewingCalc] = useState<Calculation | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const filteredCalculations = calculations.filter((calc) =>
    calc.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-10 bg-secondary rounded"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Histórico de Cálculos</h3>
          <p className="text-sm text-muted-foreground">
            {calculations.length} de 5 no plano gratuito
          </p>
        </div>
        <div className={`text-xs px-3 py-1 rounded-full ${canSaveMore ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
          {remainingCalculations} restantes
        </div>
      </div>

      {/* Campo de busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar produto…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-currency"
        />
      </div>

      {calculations.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum cálculo salvo ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Use o botão "Salvar" para guardar seus orçamentos
          </p>
        </div>
      ) : filteredCalculations.length === 0 ? (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum resultado encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Data</th>
                <th className="pb-3 font-medium text-muted-foreground">Produto</th>
                <th className="pb-3 font-medium text-muted-foreground">Tipo</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Margem</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Preço Final</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredCalculations.map((calc) => (
                <tr key={calc.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(calc.created_at)}
                  </td>
                  <td className="py-3 font-medium text-foreground max-w-[150px] truncate">
                    {calc.product_name}
                  </td>
                  <td className="py-3 text-muted-foreground whitespace-nowrap">
                    Produção Própria
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {calc.margin_percentage}%
                  </td>
                  <td className="py-3 text-right font-bold text-primary whitespace-nowrap">
                    {formatCurrency(calc.sale_price)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        onClick={() => setViewingCalc(calc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteCalculation(calc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de visualização */}
      <Dialog open={!!viewingCalc} onOpenChange={() => setViewingCalc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCalc?.product_name}</DialogTitle>
          </DialogHeader>
          {viewingCalc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Data</p>
                  <p className="font-medium">{formatDate(viewingCalc.created_at)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Quantidade</p>
                  <p className="font-medium">{viewingCalc.lot_quantity} un</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Custo Total</p>
                  <p className="font-medium">{formatCurrency(viewingCalc.total_cost)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Margem</p>
                  <p className="font-medium">{viewingCalc.margin_percentage}%</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Lucro</p>
                  <p className="font-medium text-success">{formatCurrency(viewingCalc.profit)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Preço Unitário</p>
                  <p className="font-medium">{formatCurrency(viewingCalc.unit_price)}</p>
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-xs mb-1">Preço Final de Venda</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(viewingCalc.sale_price)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedCalculations;
