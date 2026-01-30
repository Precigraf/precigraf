import React, { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { useUserPlan } from '@/hooks/useUserPlan';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import { useNavigate } from 'react-router-dom';

interface CalculationData {
  productName: string;
  quantity: number;
  paper: number;
  ink: number;
  varnish: number;
  otherMaterials: number;
  labor: number;
  energy: number;
  equipment: number;
  rent: number;
  otherCosts: number;
  profitMargin: number;
  fixedProfit: number;
  productionCost: number;
  desiredProfit: number;
  finalSellingPrice: number;
  unitPrice: number;
}

interface SaveCalculationButtonProps {
  data: CalculationData;
  onSaved?: () => void;
  editingCalculation?: { id: string; mode: 'edit' | 'duplicate' } | null;
  duplicatedFrom?: string | null;
}

const SaveCalculationButton: React.FC<SaveCalculationButtonProps> = ({ 
  data, 
  onSaved,
  editingCalculation = null,
  duplicatedFrom = null,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canSaveCalculation, canCreateCalculation, isTrialExpired, refetch } = useUserPlan();
  const navigate = useNavigate();

  const isValid = data.productName.trim().length > 0 && data.quantity > 0 && data.finalSellingPrice > 0;
  const isEditing = editingCalculation?.mode === 'edit';

  // Block saving if trial expired or can't save calculation (only for new calculations)
  const canSave = isEditing || (canCreateCalculation && canSaveCalculation);

  const handleSave = async () => {
    if (!isValid) return;

    // Check if user can save more calculations
    if (!canSave) {
      setShowUpgradeModal(true);
      return;
    }

    setIsSaving(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user) {
        toast.error('Você precisa estar logado para salvar cálculos');
        return;
      }

      const calculationData = {
        product_name: data.productName.trim(),
        lot_quantity: data.quantity,
        paper_cost: data.paper,
        ink_cost: data.ink,
        varnish_cost: data.varnish,
        other_material_cost: data.otherMaterials,
        labor_cost: data.labor,
        energy_cost: data.energy,
        equipment_cost: data.equipment,
        rent_cost: data.rent,
        other_operational_cost: data.otherCosts,
        margin_percentage: data.profitMargin,
        fixed_profit: data.fixedProfit || null,
        total_cost: data.productionCost,
        profit: data.desiredProfit,
        sale_price: data.finalSellingPrice,
        unit_price: data.unitPrice,
      };

      let error;

      if (isEditing && editingCalculation) {
        // Atualizar cálculo existente
        const result = await supabase
          .from('calculations')
          .update(calculationData)
          .eq('id', editingCalculation.id)
          .eq('user_id', session.session.user.id); // Segurança adicional
        error = result.error;
      } else {
        // Criar novo cálculo (incluindo duplicações)
        const insertData = {
          user_id: session.session.user.id,
          ...calculationData,
          is_favorite: false,
          duplicated_from: (editingCalculation?.mode === 'duplicate' && duplicatedFrom) ? duplicatedFrom : null,
        };
        
        const result = await supabase.from('calculations').insert(insertData);
        error = result.error;
      }

      if (error) {
        logError('Error saving calculation:', error);
        toast.error('Erro ao salvar cálculo');
        return;
      }

      setJustSaved(true);
      toast.success(isEditing ? 'Cálculo atualizado com sucesso!' : 'Cálculo salvo com sucesso!');
      onSaved?.();
      await refetch(); // Update calculations count

      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch (error) {
      logError('Error saving calculation:', error);
      toast.error('Erro ao salvar cálculo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleSave}
        disabled={!isValid || isSaving || justSaved}
        className="w-full gap-2"
        variant={justSaved ? 'default' : 'outline'}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : justSaved ? (
          <>
            <Check className="w-4 h-4 text-success" />
            {isEditing ? 'Atualizado!' : 'Salvo!'}
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {isEditing ? 'Atualizar cálculo' : 'Salvar cálculo'}
          </>
        )}
      </Button>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          navigate('/upgrade');
        }}
      />
    </>
  );
};

export default SaveCalculationButton;
