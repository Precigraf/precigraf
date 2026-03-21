import React, { useState, useEffect, useMemo } from 'react';
import { History, Search, Star, FileText, FileSpreadsheet, Trash2, Loader2, Lock, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logError } from '@/lib/logger';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useEditLimit } from '@/hooks/useEditLimit';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import EditCalculationModal from '@/components/EditCalculationModal';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { exportToPdf, exportToExcel, type CalculationExportData } from '@/lib/exportUtils';

interface Calculation {
  id: string;
  product_name: string;
  lot_quantity: number;
  sale_price: number;
  unit_price: number;
  is_favorite: boolean;
  created_at: string;
  paper_cost: number;
  ink_cost: number;
  varnish_cost: number;
  other_material_cost: number;
  labor_cost: number;
  energy_cost: number;
  equipment_cost: number;
  rent_cost: number;
  other_operational_cost: number;
  margin_percentage: number;
  fixed_profit: number | null;
  total_cost: number;
  profit: number;
}

interface CalculationHistoryProps {
  refreshTrigger?: number;
  onEditCalculation?: (calculation: Calculation, mode: 'edit' | 'duplicate') => void;
}

const CalculationHistory: React.FC<CalculationHistoryProps> = ({ refreshTrigger, onEditCalculation }) => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const { plan, calculationsCount, maxCalculations, refetch } = useUserPlan();
  const { canEdit, remainingEdits, refetch: refetchEditLimit } = useEditLimit();
  const navigate = useNavigate();

  const isFreePlan = plan === 'free';
  const isPro = plan === 'pro';
  const remainingCalculations = isFreePlan ? Math.max(0, maxCalculations - calculationsCount) : Infinity;
  const hasReachedLimit = isFreePlan && calculationsCount >= maxCalculations;

  const fetchCalculations = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logError('Error fetching calculations:', error);
        toast.error('Erro ao carregar histórico');
        return;
      }

      setCalculations(data || []);
    } catch (error) {
      logError('Error fetching calculations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculations();
    refetch();
  }, [refreshTrigger]);

  const filteredCalculations = useMemo(() => {
    if (!searchQuery.trim()) return calculations;
    
    const query = searchQuery.toLowerCase();
    return calculations.filter(calc => 
      calc.product_name.toLowerCase().includes(query)
    );
  }, [calculations, searchQuery]);

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('calculations')
        .update({ is_favorite: !currentValue })
        .eq('id', id);

      if (error) {
        logError('Error toggling favorite:', error);
        toast.error('Erro ao atualizar favorito');
        return;
      }

      setCalculations(prev => 
        prev.map(calc => 
          calc.id === id ? { ...calc, is_favorite: !currentValue } : calc
        ).sort((a, b) => {
          if (a.is_favorite !== b.is_favorite) {
            return b.is_favorite ? 1 : -1;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
      );

      toast.success(currentValue ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    } catch (error) {
      logError('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('calculations')
        .delete()
        .eq('id', id);

      if (error) {
        logError('Error deleting calculation:', error);
        toast.error('Erro ao excluir cálculo');
        return;
      }

      setCalculations(prev => prev.filter(calc => calc.id !== id));
      toast.success('Cálculo excluído');
      refetch(); // Update the count
    } catch (error) {
      logError('Error deleting calculation:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (calc: Calculation, formatType: 'pdf' | 'excel') => {
    // Check if user has reached limit
    if (hasReachedLimit) {
      setShowUpgradeModal(true);
      return;
    }

    setExportingId(calc.id);
    
    try {
      const exportData: CalculationExportData = {
        productName: calc.product_name,
        quantity: calc.lot_quantity,
        paperCost: calc.paper_cost,
        inkCost: calc.ink_cost,
        varnishCost: calc.varnish_cost,
        otherMaterialCost: calc.other_material_cost,
        laborCost: calc.labor_cost,
        energyCost: calc.energy_cost,
        equipmentCost: calc.equipment_cost,
        rentCost: calc.rent_cost,
        otherOperationalCost: calc.other_operational_cost,
        marginPercentage: calc.margin_percentage,
        fixedProfit: calc.fixed_profit,
        totalCost: calc.total_cost,
        profit: calc.profit,
        salePrice: calc.sale_price,
        unitPrice: calc.unit_price,
        createdAt: calc.created_at,
      };

      if (formatType === 'pdf') {
        await exportToPdf(exportData);
      } else {
        await exportToExcel(exportData);
      }

      toast.success(`Exportado como ${formatType.toUpperCase()}`);
    } catch (error) {
      logError('Error exporting:', error);
      toast.error('Erro ao exportar');
    } finally {
      setExportingId(null);
    }
  };

  const handleOpenEditModal = (calc: Calculation) => {
    setSelectedCalculation(calc);
    setEditModalOpen(true);
  };

  const handleEditOriginal = (calc: Calculation) => {
    refetchEditLimit();
    onEditCalculation?.(calc, 'edit');
  };

  const handleDuplicate = (calc: Calculation) => {
    // NÃO buscar do banco - apenas passar os dados para o formulário
    // O INSERT só acontecerá quando o usuário clicar em salvar
    refetchEditLimit();
    onEditCalculation?.({ ...calc, product_name: `${calc.product_name} (cópia)` }, 'duplicate');
  };

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-6 mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Histórico de Cálculos</h2>
              <p className="text-sm text-muted-foreground">
                {calculations.length} cálculo{calculations.length !== 1 ? 's' : ''} salvo{calculations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do produto..."
            className="pl-10"
          />
        </div>

        {/* List */}
        {calculations.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Você ainda não salvou nenhum cálculo
            </p>
          </div>
        ) : filteredCalculations.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Nenhum cálculo encontrado para esta busca
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCalculations.map((calc) => (
              <div
                key={calc.id}
                className={`p-4 rounded-lg border transition-colors ${
                  calc.is_favorite
                    ? 'bg-warning/5 border-warning/30'
                    : 'bg-secondary/30 border-border hover:bg-secondary/50'
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFavorite(calc.id, calc.is_favorite)}
                        className="shrink-0"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            calc.is_favorite
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground hover:text-warning'
                          }`}
                        />
                      </button>
                      <h3 className="font-semibold text-foreground truncate">
                        {calc.product_name}
                      </h3>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Qtd:</span>{' '}
                        <span className="font-medium">{calc.lot_quantity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>{' '}
                        <span className="font-medium text-primary">{formatCurrency(calc.sale_price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit:</span>{' '}
                        <span className="font-medium text-success">{formatCurrency(calc.unit_price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {format(new Date(calc.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons - horizontal on mobile */}
                  <div className="flex items-center justify-center gap-1 pt-2 border-t border-border/50 sm:border-0 sm:pt-0 sm:justify-end">
                    {/* Botão de Editar */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenEditModal(calc)}
                      title="Editar cálculo"
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden text-xs">Editar</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={exportingId === calc.id}
                          className="flex-1 sm:flex-none"
                        >
                          {exportingId === calc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : hasReachedLimit ? (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <FileText className="w-4 h-4 mr-1 sm:mr-0" />
                          )}
                          <span className="sm:hidden text-xs">Baixar</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport(calc, 'pdf')}>
                          <FileText className="w-4 h-4 mr-2" />
                          Exportar PDF
                          {hasReachedLimit && <Lock className="w-3 h-3 ml-2 text-muted-foreground" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(calc, 'excel')}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Exportar Excel
                          {hasReachedLimit && <Lock className="w-3 h-3 ml-2 text-muted-foreground" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                          disabled={deletingId === calc.id}
                        >
                          {deletingId === calc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1 sm:mr-0" />
                          )}
                          <span className="sm:hidden text-xs">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir cálculo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O cálculo "{calc.product_name}" será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(calc.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          navigate('/upgrade');
        }}
      />

      <EditCalculationModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCalculation(null);
        }}
        calculation={selectedCalculation}
        onEditOriginal={handleEditOriginal}
        onDuplicate={handleDuplicate}
        isPro={isPro}
        canEdit={canEdit}
        remainingEdits={remainingEdits}
      />
    </>
  );
};

export default CalculationHistory;
