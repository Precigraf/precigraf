import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useClients, type Client } from '@/hooks/useClients';
import { maskCep, maskCpfCnpj, maskPhone } from '@/lib/masks';

export interface ConvertToOrderData {
  clientId: string;
  status: string;
  amountReceived: number;
  formData: Partial<Client>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalValue: number;
  initialClientId?: string;
  onConfirm: (data: ConvertToOrderData) => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Aprovado' },
  { value: 'creating_art', label: 'Criando arte' },
  { value: 'awaiting_approval', label: 'Aguardando aprovação' },
  { value: 'in_production', label: 'Em produção' },
  { value: 'in_transport', label: 'Em Transporte' },
  { value: 'delivered', label: 'Entregue' },
];

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ConvertToOrderModal: React.FC<Props> = ({ open, onOpenChange, totalValue, initialClientId, onConfirm, isLoading }) => {
  const { clients } = useClients();
  const [clientId, setClientId] = useState<string>(initialClientId || '');
  const [search, setSearch] = useState('');
  const [popOpen, setPopOpen] = useState(false);
  const [status, setStatus] = useState('approved');
  const [amountReceived, setAmountReceived] = useState('');

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const linked = clients.find(c => c.id === clientId);

  useEffect(() => {
    if (linked) {
      setName(linked.name || '');
      setWhatsapp(linked.whatsapp || '');
      setCpf(linked.cpf || '');
      setEmail(linked.email || '');
      setCep(linked.cep || '');
      setAddress(linked.address || '');
      setAddressNumber(linked.address_number || '');
      setNeighborhood(linked.neighborhood || '');
      setCity(linked.city || '');
      setState(linked.state || '');
    }
  }, [linked]);

  useEffect(() => {
    if (open) {
      setClientId(initialClientId || '');
      setStatus('approved');
      setAmountReceived('');
      if (!initialClientId) {
        setName(''); setWhatsapp(''); setCpf(''); setEmail('');
        setCep(''); setAddress(''); setAddressNumber('');
        setNeighborhood(''); setCity(''); setState('');
      }
    }
  }, [open, initialClientId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.cpf?.includes(search));
  }, [clients, search]);

  const received = parseFloat(amountReceived.replace(',', '.')) || 0;
  const remaining = Math.max(0, totalValue - received);

  const canSubmit = name.trim() && whatsapp.trim() && amountReceived !== '' && received >= 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({
      clientId,
      status,
      amountReceived: received,
      formData: {
        name: name.trim(), whatsapp, cpf, email, cep,
        address, address_number: addressNumber, neighborhood, city, state,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Completar Dados do Pedido</DialogTitle>
          <DialogDescription>Confirme os dados do cliente e o pagamento antes de criar o pedido.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vincular cliente */}
          <div className="space-y-2">
            <Label>Vincular cliente existente</Label>
            <div className="flex gap-2">
              <Popover open={popOpen} onOpenChange={setPopOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start font-normal">
                    <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                    {linked ? linked.name : 'Buscar por nome ou CPF/CNPJ...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-card" align="start">
                  <div className="p-2 border-b border-border">
                    <Input autoFocus placeholder="Digite para buscar..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">Nenhum cliente</div>
                    ) : filtered.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setClientId(c.id); setPopOpen(false); setSearch(''); }}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b border-border/50 last:border-0"
                      >
                        <div className="font-medium text-foreground">{c.name}</div>
                        {c.cpf && <div className="text-xs text-muted-foreground">{c.cpf}</div>}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {clientId && (
                <Button variant="outline" size="icon" onClick={() => setClientId('')} title="Remover vínculo">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome Completo *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input value={whatsapp} onChange={e => setWhatsapp(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} required />
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={cpf} onChange={e => setCpf(maskCpfCnpj(e.target.value))} placeholder="000.000.000-00" maxLength={18} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={cep} onChange={e => setCep(maskCep(e.target.value))} placeholder="00000-000" maxLength={9} />
            </div>
            <div>
              <Label>Rua</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={state} onChange={e => setState(e.target.value.toUpperCase())} maxLength={2} />
            </div>
          </div>

          <div>
            <Label>Status do Pedido</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Pagamento */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Total do Pedido</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</span>
            </div>
            <div>
              <Label>Valor Recebido (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} placeholder="0,00" required />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-green-500/10 border border-green-500/30 p-2">
                <div className="text-xs text-muted-foreground">Valor recebido</div>
                <div className="font-semibold text-green-600">{formatCurrency(received)}</div>
              </div>
              <div className={`rounded-md border p-2 ${remaining > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-muted border-border'}`}>
                <div className="text-xs text-muted-foreground">Valor a receber</div>
                <div className={`font-semibold ${remaining > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{formatCurrency(remaining)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isLoading ? 'Convertendo...' : 'Converter para Pedido'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToOrderModal;
