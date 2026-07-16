import React, { useState } from 'react';
import { Package, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { useUserPlan } from '@/hooks/useUserPlan';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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
  rawInputs?: Record<string, unknown>;
}

const SaveCalculationButton: React.FC<SaveCalculationButtonProps> = ({ 
  data, 
  onSaved,
  editingCalculation = null,
  duplicatedFrom = null,
  rawInputs,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canSaveCalculation, canCreateCalculation, isTrialExpired, refetch } = useUserPlan();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isValid = data.productName.trim().length > 0 && data.quantity > 0 && data.finalSellingPrice > 0;
  const isEditing = editingCalculation?.mode === 'edit';

  // Block saving if trial expired or can't save calculation (only for new calculations)
  const canSave = isEditing || (canCreateCalculation && canSaveCalculation);

  const round2 = (v: number) => Math.round((Number(v) || 0) * 100) / 100;

  const buildNewTier = () => {
    const qty = Math.max(1, data.quantity);
    return {
      quantity: qty,
      price: round2(data.finalSellingPrice),
      cost: round2(data.productionCost),
    };
  };

  const mergeTier = (existing: any[], newTier: { quantity: number; price: number; cost: number }) => {
    const list = Array.isArray(existing) ? [...existing] : [];
    const idx = list.findIndex((t) => Number(t?.quantity) === newTier.quantity);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...newTier };
    } else {
      list.push(newTier);
    }
    return list.sort((a, b) => Number(a.quantity) - Number(b.quantity));
  };

  const derivedFromTiers = (tiers: { quantity: number; price: number; cost: number }[]) => {
    const smallest = tiers.reduce((acc, t) => (Number(t.quantity) < Number(acc.quantity) ? t : acc), tiers[0]);
    const qty = Math.max(1, Number(smallest.quantity) || 1);
    return {
      default_quantity: qty,
      unit_price: round2(Number(smallest.price) / qty),
      cost: round2(Number(smallest.cost) / qty),
    };
  };

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

      const userId = session.session.user.id;

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
        raw_inputs: (rawInputs || null) as any,
      };

      let error;
      let calculationId: string | null = null;

      if (isEditing && editingCalculation) {
        // Atualizar cálculo existente
        const result = await supabase
          .from('calculations')
          .update(calculationData)
          .eq('id', editingCalculation.id)
          .eq('user_id', userId); // Segurança adicional
        error = result.error;
        calculationId = editingCalculation.id;
      } else {
        // Criar novo cálculo (incluindo duplicações)
        const insertData = {
          user_id: userId,
          ...calculationData,
          is_favorite: false,
          duplicated_from: (editingCalculation?.mode === 'duplicate' && duplicatedFrom) ? duplicatedFrom : null,
        };
        
        const result = await supabase.from('calculations').insert(insertData).select('id').single();
        error = result.error;
        calculationId = result.data?.id ?? null;
      }

      if (error) {
        logError('Error saving calculation:', error);
        toast.error('Erro ao salvar cálculo');
        return;
      }

      // Sincronizar produto vinculado
      let productWarning = false;
      if (calculationId) {
        try {
          const productPayload = buildProductPayload(userId, calculationId);
          if (isEditing) {
            // Atualiza o produto vinculado (se existir). Se não houver, cria um.
            const { data: existing } = await supabase
              .from('products')
              .select('id')
              .eq('calculation_id', calculationId)
              .eq('user_id', userId)
              .maybeSingle();

            if (existing?.id) {
              const { error: upErr } = await supabase
                .from('products')
                .update({
                  name: productPayload.name,
                  unit_price: productPayload.unit_price,
                  cost: productPayload.cost,
                  default_quantity: productPayload.default_quantity,
                  price_tiers: productPayload.price_tiers,
                })
                .eq('id', existing.id)
                .eq('user_id', userId);
              if (upErr) productWarning = true;
            } else {
              const { error: insErr } = await supabase.from('products').insert(productPayload as any);
              if (insErr) productWarning = true;
            }
          } else {
            const { error: insErr } = await supabase.from('products').insert(productPayload as any);
            if (insErr) productWarning = true;
          }
        } catch (e) {
          logError('Error syncing product:', e);
          productWarning = true;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });

      setJustSaved(true);
      if (productWarning) {
        toast.warning(isEditing
          ? 'Cálculo atualizado, mas não foi possível sincronizar o produto.'
          : 'Cálculo salvo, mas não foi possível cadastrar o produto.');
      } else {
        toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado a partir do cálculo!');
      }
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
            {isEditing ? 'Atualizado!' : 'Cadastrado!'}
          </>
        ) : (
          <>
            <Package className="w-4 h-4" />
            {isEditing ? 'Atualizar produto' : 'Cadastrar produto'}
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
