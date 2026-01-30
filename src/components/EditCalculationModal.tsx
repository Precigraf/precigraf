import React, { useState } from 'react';
import { Edit, Copy, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';

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

interface EditCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: Calculation | null;
  onEditOriginal: (calculation: Calculation) => void;
  onDuplicate: (calculation: Calculation) => void;
  isPro: boolean;
  canEdit: boolean;
  remainingEdits: number;
}

const EditCalculationModal: React.FC<EditCalculationModalProps> = ({
  isOpen,
  onClose,
  calculation,
  onEditOriginal,
  onDuplicate,
  isPro,
  canEdit,
  remainingEdits,
}) => {
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  if (!calculation) return null;

  const handleEditOriginal = () => {
    if (!canEdit) {
      toast.error('Você atingiu o limite de edições do mês. Faça upgrade para edições ilimitadas.');
      return;
    }
    setShowConfirmEdit(true);
  };

  const confirmEditOriginal = async () => {
    if (!calculation) return;
    
    try {
      // Incrementar contador de edições (para usuários FREE)
      if (!isPro) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session?.user) {
          await supabase.rpc('increment_edit_count', { p_user_id: session.session.user.id });
        }
      }
      
      setShowConfirmEdit(false);
      onClose();
      onEditOriginal(calculation);
    } catch (error) {
      logError('Error starting edit:', error);
      toast.error('Erro ao iniciar edição');
    }
  };

  const handleDuplicate = () => {
    if (!calculation) return;
    
    // NÃO fazer INSERT no banco - apenas carregar dados no formulário
    // O INSERT só acontecerá quando o usuário clicar em "Salvar cálculo"
    onClose();
    onDuplicate(calculation);
    toast.info('Editando cópia do cálculo - salve para criar o novo registro');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Cálculo
            </DialogTitle>
            <DialogDescription>
              Escolha como deseja editar "{calculation.product_name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Opção: Duplicar (Recomendada) */}
            <button
              onClick={handleDuplicate}
              className="w-full p-4 rounded-lg border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors text-left group relative"
            >
              <Badge className="absolute top-2 right-2 bg-success text-success-foreground text-xs">
                Recomendado
              </Badge>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Copy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">
                    Duplicar e editar
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cria uma cópia do cálculo para edição. O original permanece intacto.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Mais seguro
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Mantém histórico
                    </Badge>
                  </div>
                </div>
              </div>
            </button>

            {/* Opção: Editar Original */}
            <button
              onClick={handleEditOriginal}
              disabled={!canEdit}
              className={`w-full p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <Edit className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">
                    Editar original
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Modifica diretamente o cálculo salvo. Não pode ser desfeito.
                  </p>
                  {!isPro && (
                    <div className="mt-2">
                      {canEdit ? (
                        <Badge variant="outline" className="text-xs">
                          {remainingEdits} edições restantes este mês
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Limite de edições atingido
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação para editar original */}
      <AlertDialog open={showConfirmEdit} onOpenChange={setShowConfirmEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Confirmar edição
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este cálculo será atualizado com os novos valores. Esta ação não pode ser desfeita.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEditOriginal}>
              Sim, editar original
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditCalculationModal;
