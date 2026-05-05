import { supabase } from '@/integrations/supabase/client';

export async function callAdmin<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}
