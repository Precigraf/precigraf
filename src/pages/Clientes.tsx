import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, Edit2, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Header from '@/components/Header';
import ClientForm from '@/components/gestao/ClientForm';
import { useClients, type Client } from '@/hooks/useClients';

const Clientes: React.FC = () => {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp?.includes(search)
  );

  const handleSubmit = (data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, ...data }, { onSuccess: () => { setFormOpen(false); setEditingClient(null); } });
    } else {
      createClient.mutate(data, { onSuccess: () => { setFormOpen(false); } });
    }
  };

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${clean}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => { setEditingClient(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <Card key={client.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      {client.email && (
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>
                      )}
                      {client.whatsapp && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.whatsapp}</span>
                      )}
                      {client.city && client.state && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.city}/{client.state}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {client.whatsapp && (
                      <Button variant="ghost" size="icon" onClick={() => openWhatsApp(client.whatsapp!)} className="text-green-500 hover:text-green-600" title="Abrir WhatsApp">
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditingClient(client); setFormOpen(true); }} title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação excluirá também todos os orçamentos e pedidos vinculados a este cliente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteClient.mutate(client.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <ClientForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          initialData={editingClient}
          isLoading={createClient.isPending || updateClient.isPending}
        />
      </div>
    </div>
  );
};

export default Clientes;
