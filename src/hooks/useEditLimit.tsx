import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/lib/logger';

interface EditLimitData {
  canEdit: boolean;
  remainingEdits: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useEditLimit = (): EditLimitData => {
  const { user } = useAuth();
  const [canEdit, setCanEdit] = useState(true);
  const [remainingEdits, setRemainingEdits] = useState(3);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_edit_limit', {
        p_user_id: user.id,
      });

      if (error) {
        logError('Error checking edit limit:', error);
        return;
      }

      const result = data as {
        allowed: boolean;
        remaining?: number;
        reason?: string;
        plan?: string;
      };

      setCanEdit(result.allowed);
      
      if (result.plan === 'pro') {
        setRemainingEdits(-1); // -1 indica ilimitado
      } else if (result.remaining !== undefined) {
        setRemainingEdits(result.remaining);
      }
    } catch (error) {
      logError('Error in useEditLimit:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    canEdit,
    remainingEdits,
    loading,
    refetch: fetchData,
  };
};
