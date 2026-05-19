import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/imageCompress';

export interface CompanyProfile {
  store_name: string | null;
  system_color: string | null;
  logo_url: string | null;
  company_name: string | null;
  company_document: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_address: string | null;
  company_address_number: string | null;
  company_neighborhood: string | null;
  company_city: string | null;
  company_state: string | null;
  company_cep: string | null;
  pix_key: string | null;
  company_full_address: string | null;
}

export function useCompanyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['company-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('store_name, system_color, logo_url, company_name, company_document, company_phone, company_email, company_address, company_address_number, company_neighborhood, company_city, company_state, company_cep, pix_key, company_full_address')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data as CompanyProfile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<CompanyProfile>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast({ title: 'Dados salvos com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    // Comprime no client antes (muito mais rápido para subir)
    const blob = await compressImage(file, 512, 0.82).catch(() => file);
    const ext = blob.type === 'image/webp' ? 'webp'
      : blob.type === 'image/png' ? 'png'
      : blob.type === 'image/svg+xml' ? 'svg'
      : 'jpg';
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('armazenamento')
      .upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: '3600' });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('armazenamento').getPublicUrl(path);
    // Cache-busting para refletir nova imagem imediatamente
    return `${data.publicUrl}?v=${Date.now()}`;
  };

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    updateProfile,
    uploadLogo,
  };
}
