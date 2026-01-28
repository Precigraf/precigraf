import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/lib/logger';

interface SubscriptionPlan {
  name: string;
  max_calculations: number;
  can_export: boolean;
}

type PlanStatus = 'trial' | 'free' | 'pro';

interface UserPlanData {
  plan: 'free' | 'pro';
  planStatus: PlanStatus;
  calculationsCount: number;
  canSaveCalculation: boolean;
  canExport: boolean;
  maxCalculations: number;
  loading: boolean;
  refetch: () => Promise<void>;
  trialEndsAt: Date | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialRemainingHours: number;
  canCreateCalculation: boolean;
}

const FREE_PLAN_LIMIT = 2;

export const useUserPlan = (): UserPlanData => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [calculationsCount, setCalculationsCount] = useState(0);
  const [maxCalculations, setMaxCalculations] = useState(FREE_PLAN_LIMIT);
  const [canExport, setCanExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user profile with subscription plan details and trial_ends_at
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          plan,
          plan_id,
          trial_ends_at,
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

      // Set trial_ends_at
      if (profileData?.trial_ends_at) {
        setTrialEndsAt(new Date(profileData.trial_ends_at));
      } else {
        setTrialEndsAt(null);
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

  // Calculate trial status
  const now = new Date();
  const isTrialActive = trialEndsAt !== null && trialEndsAt > now && plan === 'free';
  const isTrialExpired = trialEndsAt !== null && trialEndsAt <= now && plan === 'free';
  
  // Calculate remaining hours
  const trialRemainingHours = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
    : 0;

  // Determine plan status
  let planStatus: PlanStatus = 'free';
  if (plan === 'pro') {
    planStatus = 'pro';
  } else if (isTrialActive) {
    planStatus = 'trial';
  } else {
    planStatus = 'free';
  }

  // Can save calculation: Pro users always can, trial users within limit, expired trial users cannot
  const canSaveCalculation = plan === 'pro' || (isTrialActive && calculationsCount < maxCalculations);

  // Can create calculation: Pro users always can, trial users can, expired trial users cannot
  const canCreateCalculation = plan === 'pro' || isTrialActive;

  return {
    plan,
    planStatus,
    calculationsCount,
    canSaveCalculation,
    canExport,
    maxCalculations,
    loading,
    refetch: fetchData,
    trialEndsAt,
    isTrialActive,
    isTrialExpired,
    trialRemainingHours,
    canCreateCalculation,
  };
};
