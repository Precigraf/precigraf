import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CatalogSettings {
  user_id: string;
  slug: string;
  is_active: boolean;
  whatsapp_message_template: string;
  primary_color: string;
}

export interface CatalogBanner {
  id: string;
  user_id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  bg_color: string;
  cta_label: string | null;
  cta_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogFeatured {
  id: string;
  user_id: string;
  product_id: string;
  badge: 'promo' | 'new' | null;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_TEMPLATE = `Olá {loja}! Quero fazer um pedido:

{itens}

Total: {total}`;

export function useCatalogSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['catalog-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_settings' as any)
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as CatalogSettings | null;
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<CatalogSettings> & { slug: string }) => {
      if (!user) throw new Error('Não autenticado');
      const payload = {
        user_id: user.id,
        slug: input.slug.toLowerCase().trim(),
        is_active: input.is_active ?? true,
        whatsapp_message_template: input.whatsapp_message_template ?? DEFAULT_TEMPLATE,
        primary_color: input.primary_color ?? '#534AB7',
      };
      const { data, error } = await supabase
        .from('catalog_settings' as any)
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CatalogSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-settings'] });
      toast({ title: 'Configurações salvas' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' }),
  });

  return { settings: q.data ?? null, isLoading: q.isLoading, upsert };
}

export function useCatalogBanners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['catalog-banners', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_banners' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CatalogBanner[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<CatalogBanner>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('catalog_banners' as any)
        .insert({
          user_id: user.id,
          title: input.title || 'Novo banner',
          eyebrow: input.eyebrow ?? null,
          subtitle: input.subtitle ?? null,
          bg_color: input.bg_color ?? '#26215C',
          cta_label: input.cta_label ?? null,
          cta_url: input.cta_url ?? null,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-banners'] });
      toast({ title: 'Banner criado' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CatalogBanner> & { id: string }) => {
      const { data, error } = await supabase
        .from('catalog_banners' as any)
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-banners'] }),
    onError: (e: Error) =>
      toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catalog_banners' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-banners'] });
      toast({ title: 'Banner removido' });
    },
  });

  return { banners: q.data ?? [], isLoading: q.isLoading, create, update, remove };
}

export function useCatalogFeatured() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['catalog-featured', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_featured' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CatalogFeatured[];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (input: { product_id: string; badge: 'promo' | 'new' | null; sort_order?: number; is_active?: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('catalog_featured' as any)
        .upsert(
          {
            user_id: user.id,
            product_id: input.product_id,
            badge: input.badge,
            sort_order: input.sort_order ?? 0,
            is_active: input.is_active ?? true,
          },
          { onConflict: 'user_id,product_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-featured'] }),
    onError: (e: Error) =>
      toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catalog_featured' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-featured'] }),
  });

  return { featured: q.data ?? [], isLoading: q.isLoading, upsert, remove };
}

// ============= Public ============
export interface PublicCatalogData {
  store: {
    name: string;
    logo_url: string | null;
    whatsapp: string | null;
    primary_color: string;
    whatsapp_message_template: string;
  };
  banners: Array<{
    id: string;
    eyebrow: string | null;
    title: string;
    subtitle: string | null;
    bg_color: string;
    cta_label: string | null;
    cta_url: string | null;
  }>;
  categories: Array<{ id: string; name: string }>;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    size: string | null;
    material: string | null;
    finish: string | null;
    production_time: string | null;
    unit_price: number;
    default_quantity: number;
    price_tiers: Array<{ quantity: number; price: number; cost?: number }>;
    category_id: string | null;
    badge: 'promo' | 'new' | null;
    sort_order: number;
  }>;
}

export function usePublicCatalog(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-catalog', slug],
    queryFn: async (): Promise<PublicCatalogData | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_catalog' as any, { p_slug: slug });
      if (error) throw error;
      const payload = data as any;
      if (!payload || payload.error) return null;
      return payload as PublicCatalogData;
    },
    enabled: !!slug,
  });
}
