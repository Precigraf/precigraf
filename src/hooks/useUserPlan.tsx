import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/lib/logger';

interface UserPlanData {
  plan: 'free' | 'pro';
  calculationsCount: number;
  canSaveCalculation: boolean;
  maxCalculations: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

const FREE_PLAN_LIMIT = 3;

export const useUserPlan = (): UserPlanData => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [calculationsCount, setCalculationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user plan from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        logError('Error fetching profile:', profileError);
      }

      const userPlan = (profileData?.plan === 'pro' ? 'pro' : 'free') as 'free' | 'pro';
      setPlan(userPlan);

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

  const canSaveCalculation = plan === 'pro' || calculationsCount < FREE_PLAN_LIMIT;
  const maxCalculations = plan === 'pro' ? Infinity : FREE_PLAN_LIMIT;

  return {
    plan,
    calculationsCount,
    canSaveCalculation,
    maxCalculations,
    loading,
    refetch: fetchData,
  };
};
