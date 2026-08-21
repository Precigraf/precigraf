import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  CatalogConfig,
  PriceCatalog,
  createDefaultConfig,
  normalizeConfig,
} from '@/lib/catalogBuilder/types';

const TABLE = 'price_catalogs';

type RawRow = {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  product_id: string | null;
  configuration: unknown;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
};

const toCatalog = (row: RawRow): PriceCatalog => ({
  ...row,
  configuration: normalizeConfig(row.configuration),
});

export function usePriceCatalogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['price-catalogs', user?.id],
    queryFn: async (): Promise<PriceCatalog[]> => {
      const { data, error } = await supabase
        .from(TABLE as never)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as RawRow[]).map(toCatalog);
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input?: { name?: string; configuration?: CatalogConfig }) => {
      if (!user) throw new Error('Não autenticado');
      const configuration = input?.configuration ?? createDefaultConfig();
      const { data, error } = await supabase
        .from(TABLE as never)
        .insert({
          user_id: user.id,
          name: input?.name ?? 'Novo catálogo',
          template_id: configuration.templateId,
          configuration: configuration as never,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return toCatalog(data as unknown as RawRow);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-catalogs'] }),
    onError: (e: Error) =>
      toast({ title: 'Erro ao criar catálogo', description: e.message, variant: 'destructive' }),
  });

  const duplicate = useMutation({
    mutationFn: async (catalog: PriceCatalog) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from(TABLE as never)
        .insert({
          user_id: user.id,
          name: `${catalog.name} (Cópia)`.slice(0, 80),
          template_id: catalog.template_id,
          product_id: catalog.product_id,
          configuration: catalog.configuration as never,
          thumbnail_url: catalog.thumbnail_url,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return toCatalog(data as unknown as RawRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-catalogs'] });
      toast({ title: 'Catálogo duplicado' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erro ao duplicar', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE as never).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-catalogs'] });
      toast({ title: 'Catálogo excluído' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' }),
  });

  return { catalogs: q.data ?? [], isLoading: q.isLoading, create, duplicate, remove };
}

export function usePriceCatalog(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['price-catalog', id],
    queryFn: async (): Promise<PriceCatalog | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from(TABLE as never)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? toCatalog(data as unknown as RawRow) : null;
    },
    enabled: !!id && !!user,
  });
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Autosave com debounce, sem condição de corrida (sempre salva o último estado). */
export function useCatalogAutosave(id: string | undefined, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ name: string; configuration: CatalogConfig } | null>(null);
  const inFlight = useRef(false);
  const qc = useQueryClient();

  const flush = useCallback(async () => {
    if (!id || inFlight.current || !pending.current) return;
    const payload = pending.current;
    pending.current = null;
    inFlight.current = true;
    setStatus('saving');
    const { error } = await supabase
      .from(TABLE as never)
      .update({
        name: payload.name,
        configuration: payload.configuration as never,
        template_id: payload.configuration.templateId,
      } as never)
      .eq('id', id);
    inFlight.current = false;
    if (error) {
      pending.current = payload;
      setStatus('error');
      return;
    }
    qc.invalidateQueries({ queryKey: ['price-catalogs'] });
    if (pending.current) {
      void flush();
    } else {
      setStatus('saved');
    }
  }, [id, qc]);

  const schedule = useCallback(
    (name: string, configuration: CatalogConfig) => {
      pending.current = { name, configuration };
      setStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  const retry = useCallback(() => void flush(), [flush]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { status, schedule, retry };
}
