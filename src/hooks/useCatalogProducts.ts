import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CatalogCategory {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  promo_price: number | null;
  stock: number | null;
  stock_type: 'infinite' | 'limited';
  is_active: boolean;
  sort_order: number;
}

export interface CatalogImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
}

export interface CatalogProduct {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  promo_price: number | null;
  stock: number | null;
  delivery_time: string | null;
  delivery_notes: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  variation_label: string | null;
  variants?: CatalogVariant[];
  images?: CatalogImage[];
}

export function useCatalogCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['catalog-categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_product_categories' as any)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CatalogCategory[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; parent_id?: string | null }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('catalog_product_categories' as any)
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          parent_id: input.parent_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-categories'] });
      toast({ title: 'Categoria criada' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CatalogCategory> & { id: string }) => {
      const { error } = await supabase
        .from('catalog_product_categories' as any)
        .update(rest)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-categories'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalog_product_categories' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-categories'] });
      qc.invalidateQueries({ queryKey: ['catalog-products'] });
      toast({ title: 'Categoria removida' });
    },
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase.from('catalog_product_categories' as any).update({ sort_order: idx }).eq('id', id),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-categories'] }),
  });

  return { categories: q.data ?? [], isLoading: q.isLoading, create, update, remove, reorder };
}

export function useCatalogProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['catalog-products', user?.id],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('catalog_products' as any)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      const list = (products ?? []) as unknown as CatalogProduct[];
      if (list.length === 0) return list;

      const ids = list.map((p) => p.id);
      const [{ data: vars }, { data: imgs }] = await Promise.all([
        supabase.from('catalog_product_variants' as any).select('*').in('product_id', ids),
        supabase.from('catalog_product_images' as any).select('*').in('product_id', ids),
      ]);
      const variants = (vars ?? []) as unknown as CatalogVariant[];
      const images = (imgs ?? []) as unknown as CatalogImage[];
      return list.map((p) => ({
        ...p,
        variants: variants
          .filter((v) => v.product_id === p.id)
          .sort((a, b) => a.sort_order - b.sort_order),
        images: images
          .filter((i) => i.product_id === p.id)
          .sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<CatalogProduct>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('catalog_products' as any)
        .insert({
          user_id: user.id,
          name: input.name?.trim() || 'Novo produto',
          description: input.description ?? null,
          price: input.price ?? 0,
          promo_price: input.promo_price ?? null,
          stock: input.stock ?? null,
          delivery_time: input.delivery_time ?? null,
          delivery_notes: input.delivery_notes ?? null,
          category_id: input.category_id ?? null,
          is_active: input.is_active ?? true,
          is_featured: input.is_featured ?? false,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CatalogProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-products'] });
      toast({ title: 'Produto cadastrado' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CatalogProduct> & { id: string }) => {
      const { error } = await supabase.from('catalog_products' as any).update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-products'] }),
    onError: (e: Error) =>
      toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catalog_products' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-products'] });
      toast({ title: 'Produto removido' });
    },
  });

  return { products: q.data ?? [], isLoading: q.isLoading, create, update, remove };
}

// Variants helpers (replace all for a product)
export async function replaceVariants(
  userId: string,
  productId: string,
  variants: Array<{ name: string; price: number; stock: number | null }>,
) {
  await supabase.from('catalog_product_variants' as any).delete().eq('product_id', productId);
  if (variants.length === 0) return;
  const rows = variants.map((v, i) => ({
    user_id: userId,
    product_id: productId,
    name: v.name.trim(),
    price: v.price || 0,
    stock: v.stock,
    sort_order: i,
  }));
  const { error } = await supabase.from('catalog_product_variants' as any).insert(rows);
  if (error) throw error;
}

// Images helpers
export async function uploadCatalogImage(userId: string, productId: string, file: File) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${productId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('catalog-images')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from('catalog-images').getPublicUrl(path);
  return { url: pub.publicUrl, storage_path: path };
}

export async function saveProductImages(
  userId: string,
  productId: string,
  images: Array<{ url: string; storage_path: string | null }>,
) {
  // Delete existing then re-insert (simple)
  const { data: existing } = await supabase
    .from('catalog_product_images' as any)
    .select('storage_path')
    .eq('product_id', productId);
  const oldPaths = (existing ?? [])
    .map((r: any) => r.storage_path)
    .filter((p: string | null): p is string => !!p);
  await supabase.from('catalog_product_images' as any).delete().eq('product_id', productId);
  // Remove orphaned storage files (those not kept)
  const kept = new Set(images.map((i) => i.storage_path).filter(Boolean) as string[]);
  const toDelete = oldPaths.filter((p: string) => !kept.has(p));
  if (toDelete.length > 0) {
    await supabase.storage.from('catalog-images').remove(toDelete);
  }
  if (images.length === 0) return;
  const rows = images.slice(0, 5).map((img, i) => ({
    user_id: userId,
    product_id: productId,
    url: img.url,
    storage_path: img.storage_path,
    sort_order: i,
  }));
  const { error } = await supabase.from('catalog_product_images' as any).insert(rows);
  if (error) throw error;
}
