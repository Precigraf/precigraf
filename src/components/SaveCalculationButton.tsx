import React, { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
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
  categoryId?: string | null;
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
  const { canSaveCalculation, canCreateCalculation, refetch } = useUserPlan();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isValid = data.productName.trim().length > 0 && data.quantity > 0 && data.finalSellingPrice > 0;
  const isEditing = editingCalculation?.mode === 'edit';
  const canSave = isEditing || (canCreateCalculation && canSaveCalculation);

  const upsertLinkedProduct = async (
    userId: string,
    calculationId: string,
    existingProductId: string | null
  ): Promise<string | null> => {
    const qty = data.quantity > 0 ? data.quantity : 1;
    const matCost = (data.paper || 0) + (data.ink || 0) + (data.varnish || 0) + (data.otherMaterials || 0);
    const opCost = (data.labor || 0) + (data.energy || 0) + (data.equipment || 0) + (data.rent || 0) + (data.otherCosts || 0);
    const unitCostProd = matCost / qty;
    const unitCostOp = opCost / qty;
    const unitCost = unitCostProd + unitCostOp;
    const productPayload = {
      name: data.productName.trim(),
      category_id: data.categoryId ?? null,
      cost: unitCost,
      unit_price: data.unitPrice,
      default_quantity: data.quantity,
      price_tiers: [{
        quantity: data.quantity,
        cost: unitCost,
        cost_production: unitCostProd,
        cost_operational: unitCostOp,
        price: data.unitPrice,
      }] as any,
      is_active: true,
    };

    if (existingProductId) {
      const { error } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', existingProductId)
        .eq('user_id', userId);
      if (error) {
        logError('Error updating linked product:', error);
        return existingProductId;
      }
      return existingProductId;
    }

    const { data: created, error } = await supabase
      .from('products')
      .insert({ ...productPayload, user_id: userId })
      .select('id')
      .single();
    if (error) {
      logError('Error creating linked product:', error);
      return null;
    }
    return created?.id ?? null;
  };

  const handleSave = async () => {
    if (!isValid) return;
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

      const calculationData: any = {
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
        category_id: data.categoryId ?? null,
      };

      let calcId: string | null = null;
      let existingProductId: string | null = null;

      if (isEditing && editingCalculation) {
        const { data: existing } = await supabase
          .from('calculations')
          .select('product_id')
          .eq('id', editingCalculation.id)
          .eq('user_id', userId)
          .maybeSingle();
        existingProductId = (existing as any)?.product_id ?? null;

        const { error } = await supabase
          .from('calculations')
          .update(calculationData)
          .eq('id', editingCalculation.id)
          .eq('user_id', userId);
        if (error) throw error;
        calcId = editingCalculation.id;
      } else {
        const insertData = {
          user_id: userId,
          ...calculationData,
          is_favorite: false,
          duplicated_from:
            editingCalculation?.mode === 'duplicate' && duplicatedFrom ? duplicatedFrom : null,
        };
        const { data: inserted, error } = await supabase
          .from('calculations')
          .insert(insertData)
          .select('id')
          .single();
        if (error) throw error;
        calcId = (inserted as any)?.id ?? null;
      }

      // Upsert linked product
      let productId: string | null = null;
      if (calcId) {
        productId = await upsertLinkedProduct(userId, calcId, existingProductId);
        if (productId && productId !== existingProductId) {
          await supabase
            .from('calculations')
            .update({ product_id: productId } as any)
            .eq('id', calcId)
            .eq('user_id', userId);
        }
      }

      qc.invalidateQueries({ queryKey: ['products'] });

      setJustSaved(true);
      toast.success(
        isEditing
          ? 'Cálculo atualizado e produto sincronizado!'
          : 'Cálculo salvo e produto cadastrado!'
      );
      onSaved?.();
      await refetch();

      setTimeout(() => setJustSaved(false), 2000);
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
