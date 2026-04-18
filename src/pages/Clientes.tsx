import React, { useState } from 'react';
import { Plus, Search, Mail, Edit2, Trash2, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/AppLayout';
import ClientForm from '@/components/gestao/ClientForm';
import { useClients, type Client } from '@/hooks/useClients';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Clientes: React.FC = () => {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp?.includes(search) ||
    c.cpf?.includes(search)
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
    <AppLayout>
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
          <Input placeholder="Buscar por nome, email, telefone ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
                        <span className="flex items-center gap-1"><WhatsAppIcon className="w-3 h-3" />{client.whatsapp}</span>
                      )}
                      {client.city && client.state && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.city}/{client.state}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {client.whatsapp && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openWhatsApp(client.whatsapp!)}
                        className="border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] hover:text-[#25D366]"
                        title="Abrir WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setViewingClient(client)} title="Visualizar cadastro">
                      <Eye className="w-4 h-4" />
                    </Button>
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

        {/* View Client Dialog */}
        <Dialog open={!!viewingClient} onOpenChange={(o) => !o && setViewingClient(null)}>
          <DialogContent className="max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Cadastro do Cliente</DialogTitle>
            </DialogHeader>
            {viewingClient && (
              <div className="space-y-3 text-sm">
                <Field label="Nome" value={viewingClient.name} />
                <Field label="CPF/CNPJ" value={viewingClient.cpf} />
                <Field label="E-mail" value={viewingClient.email} />
                <Field label="WhatsApp" value={viewingClient.whatsapp} />
                <div className="border-t border-border pt-3">
                  <Field label="CEP" value={viewingClient.cep} />
                  <Field label="Endereço" value={[viewingClient.address, viewingClient.address_number].filter(Boolean).join(', ')} />
                  <Field label="Bairro" value={viewingClient.neighborhood} />
                  <Field label="Cidade/Estado" value={[viewingClient.city, viewingClient.state].filter(Boolean).join('/')} />
                  <Field label="Ponto de referência" value={viewingClient.landmark} />
                </div>
                {viewingClient.notes && (
                  <div className="border-t border-border pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Observações</div>
                    <div className="text-foreground whitespace-pre-wrap">{viewingClient.notes}</div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground text-right break-words">{value}</span>
    </div>
  );
};

export default Clientes;
