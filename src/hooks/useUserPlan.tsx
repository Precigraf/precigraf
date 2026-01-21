import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/lib/logger';

interface SubscriptionPlan {
  name: string;
  max_calculations: number;
  can_export: boolean;
}

interface UserPlanData {
  plan: 'free' | 'pro';
  calculationsCount: number;
  canSaveCalculation: boolean;
  canExport: boolean;
  maxCalculations: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

const FREE_PLAN_LIMIT = 2;

export const useUserPlan = (): UserPlanData => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [calculationsCount, setCalculationsCount] = useState(0);
  const [maxCalculations, setMaxCalculations] = useState(FREE_PLAN_LIMIT);
  const [canExport, setCanExport] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user profile with subscription plan details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          plan,
          plan_id,
          subscription_plans:plan_id (
            name,
            max_calculations,
            can_export
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        logError('Error fetching profile:', profileError);
      }

      // Determine plan from subscription_plans or fallback to plan column
      const subscriptionPlan = profileData?.subscription_plans as SubscriptionPlan | null;
      
      if (subscriptionPlan) {
        // Use subscription_plans table data
        const isLifetime = subscriptionPlan.name === 'lifetime';
        setPlan(isLifetime ? 'pro' : 'free');
        setMaxCalculations(subscriptionPlan.max_calculations);
        setCanExport(subscriptionPlan.can_export);
      } else {
        // Fallback to plan column
        const userPlan = (profileData?.plan === 'pro' ? 'pro' : 'free') as 'free' | 'pro';
        setPlan(userPlan);
        setMaxCalculations(userPlan === 'pro' ? 999999 : FREE_PLAN_LIMIT);
        setCanExport(userPlan === 'pro');
      }

      // Fetch calculations count
      const { count, error: countError } = await supabase
        .from('calculations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        logError('Error fetching calculations count:', countError);
      }

      setCalculationsCount(count || 0);
    } catch (error) {
      logError('Error in useUserPlan:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canSaveCalculation = plan === 'pro' || calculationsCount < maxCalculations;

  return {
    plan,
    calculationsCount,
    canSaveCalculation,
    canExport,
    maxCalculations,
    loading,
    refetch: fetchData,
  };
};
