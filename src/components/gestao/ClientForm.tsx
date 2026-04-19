import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Client } from '@/hooks/useClients';
import { maskCep, maskCpfCnpj } from '@/lib/masks';

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Client | null;
  isLoading?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ open, onOpenChange, onSubmit, initialData, isLoading }) => {
  const [form, setForm] = useState({
    name: '', email: '', whatsapp: '', cpf: '', cep: '',
    address: '', neighborhood: '', address_number: '', landmark: '',
    city: '', state: '', notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        whatsapp: initialData.whatsapp || '',
        cpf: initialData.cpf || '',
        cep: initialData.cep || '',
        address: initialData.address || '',
        neighborhood: initialData.neighborhood || '',
        address_number: initialData.address_number || '',
        landmark: initialData.landmark || '',
        city: initialData.city || '',
        state: initialData.state || '',
        notes: initialData.notes || '',
      });
    } else {
      setForm({ name: '', email: '', whatsapp: '', cpf: '', cep: '', address: '', neighborhood: '', address_number: '', landmark: '', city: '', state: '', notes: '' });
    }
  }, [initialData, open]);

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      cpf: form.cpf || null,
      cep: form.cep || null,
      address: form.address || null,
      neighborhood: form.neighborhood || null,
      address_number: form.address_number || null,
      landmark: form.landmark || null,
      city: form.city || null,
      state: form.state || null,
      notes: form.notes || null,
    });
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={e => update('name', e.target.value)} required maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} maxLength={255} />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="(99) 99999-9999" maxLength={20} />
            </div>
          </div>
          <div>
            <Label htmlFor="cpf">CPF/CNPJ</Label>
            <Input id="cpf" value={form.cpf} onChange={e => update('cpf', maskCpfCnpj(e.target.value))} placeholder="000.000.000-00" maxLength={18} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" value={form.cep} onChange={e => update('cep', maskCep(e.target.value))} onBlur={() => handleCepLookup(form.cep)} placeholder="00000-000" maxLength={9} />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input id="state" value={form.state} onChange={e => update('state', e.target.value)} maxLength={2} />
            </div>
          </div>
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={form.city} onChange={e => update('city', e.target.value)} maxLength={100} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={form.address} onChange={e => update('address', e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="address_number">Nº</Label>
              <Input id="address_number" value={form.address_number} onChange={e => update('address_number', e.target.value)} maxLength={10} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="landmark">Ponto de Referência</Label>
              <Input id="landmark" value={form.landmark} onChange={e => update('landmark', e.target.value)} maxLength={100} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !form.name.trim()}>{initialData ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
