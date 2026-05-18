import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  cpf: string | null;
  cep: string | null;
  address: string | null;
  neighborhood: string | null;
  address_number: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export function useClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<ClientInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente cadastrado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cadastrar cliente', description: error.message, variant: 'destructive' });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar cliente', description: error.message, variant: 'destructive' });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir cliente', description: error.message, variant: 'destructive' });
    },
  });

  return { clients: clientsQuery.data ?? [], isLoading: clientsQuery.isLoading, createClient, updateClient, deleteClient };
}
