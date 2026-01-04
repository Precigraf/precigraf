import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Calculation {
  id: string;
  product_name: string;
  cost_type: string;
  lot_quantity: number;
  lot_cost: number;
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
  sale_price: number;
  unit_price: number;
  created_at: string;
}

const FREE_PLAN_LIMIT = 5;

export const useCalculations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const fetchCalculations = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error, count: totalCount } = await supabase
      .from('calculations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calculations:', error);
    } else {
      setCalculations(data || []);
      setCount(totalCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCalculations();
  }, [user]);

  const canSaveMore = count < FREE_PLAN_LIMIT;
  const remainingCalculations = Math.max(0, FREE_PLAN_LIMIT - count);

  const saveCalculation = async (data: {
    productName: string;
    costType: string;
    lotQuantity: number;
    lotCost: number;
    paperCost: number;
    inkCost: number;
    varnishCost: number;
    otherMaterialCost: number;
    laborCost: number;
    energyCost: number;
    equipmentCost: number;
    rentCost: number;
    otherOperationalCost: number;
    marginPercentage: number;
    fixedProfit: number | null;
    totalCost: number;
    profit: number;
    salePrice: number;
    unitPrice: number;
  }) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para salvar cálculos.",
        variant: "destructive",
      });
      return { success: false };
    }

    if (!canSaveMore) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de 5 cálculos no plano gratuito. Faça upgrade para salvar mais!",
        variant: "destructive",
      });
      return { success: false };
    }

    const { error } = await supabase.from('calculations').insert({
      user_id: user.id,
      product_name: data.productName,
      cost_type: data.costType,
      lot_quantity: data.lotQuantity,
      lot_cost: data.lotCost,
      paper_cost: data.paperCost,
      ink_cost: data.inkCost,
      varnish_cost: data.varnishCost,
      other_material_cost: data.otherMaterialCost,
      labor_cost: data.laborCost,
      energy_cost: data.energyCost,
      equipment_cost: data.equipmentCost,
      rent_cost: data.rentCost,
      other_operational_cost: data.otherOperationalCost,
      margin_percentage: data.marginPercentage,
      fixed_profit: data.fixedProfit || null,
      total_cost: data.totalCost,
      profit: data.profit,
      sale_price: data.salePrice,
      unit_price: data.unitPrice,
    });

    if (error) {
      console.error('Error saving calculation:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cálculo. Tente novamente.",
        variant: "destructive",
      });
      return { success: false };
    }

    toast({
      title: "Cálculo salvo!",
      description: `Restam ${remainingCalculations - 1} cálculos no plano gratuito.`,
    });

    await fetchCalculations();
    return { success: true };
  };

  const deleteCalculation = async (id: string) => {
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calculation:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cálculo.",
        variant: "destructive",
      });
      return { success: false };
    }

    toast({
      title: "Cálculo excluído",
      description: "O cálculo foi removido com sucesso.",
    });

    await fetchCalculations();
    return { success: true };
  };

  return {
    calculations,
    loading,
    count,
    canSaveMore,
    remainingCalculations,
    saveCalculation,
    deleteCalculation,
    refresh: fetchCalculations,
  };
};
