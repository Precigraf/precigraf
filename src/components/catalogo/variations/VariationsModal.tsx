import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface VariationData {
  label: string; // ex: "Quantidades", "Cor"
  options: string[]; // ex: ["50","40","30","20"]
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: VariationData | null;
  onSave: (next: VariationData | null) => void;
}

type View = 'list' | 'form';

export const VariationsModal: React.FC<Props> = ({ open, onOpenChange, value, onSave }) => {
  const { toast } = useToast();
  const [view, setView] = useState<View>('list');
  const [label, setLabel] = useState('');
  const [options, setOptions] = useState<string[]>(['']);

  useEffect(() => {
    if (!open) return;
    setView('list');
  }, [open]);

  const openCreate = () => {
    setLabel(value?.label ?? '');
    setOptions(value?.options.length ? [...value.options, ''] : ['']);
    setView('form');
  };

  const handleSave = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      toast({ title: 'Informe o nome da variação', variant: 'destructive' });
      return;
    }
    const cleaned = options
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (cleaned.length === 0) {
      toast({ title: 'Adicione ao menos uma opção', variant: 'destructive' });
      return;
    }
    const unique = Array.from(new Set(cleaned));
    if (unique.length !== cleaned.length) {
      toast({ title: 'Opções duplicadas removidas', variant: 'destructive' });
    }
    onSave({ label: trimmedLabel, options: unique });
    setView('list');
  };

  const removeOption = (i: number) =>
    setOptions((arr) => (arr.length === 1 ? [''] : arr.filter((_, idx) => idx !== i)));

  const addOption = () => setOptions((arr) => [...arr, '']);

  const updateOption = (i: number, v: string) =>
    setOptions((arr) => arr.map((o, idx) => (idx === i ? v : o)));

  const removeVariation = () => {
    onSave(null);
    setView('list');
  };

  const quickAddOption = () => {
    openCreate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 max-h-[90vh] flex flex-col">
        {view === 'list' ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={() => onOpenChange(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Fechar
              </button>
              <h2 className="font-semibold text-foreground text-sm">Adicionar variações</h2>
              <span className="w-12" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Adicione ao seu produto variantes como "cores", "tamanhos", e outros.
              </p>

              {value ? (
                <div className="border-2 border-primary/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{value.label}</div>
                      <div className="text-[11px] text-muted-foreground">Selecione as opções</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={openCreate} title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={removeVariation} title="Remover">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={quickAddOption}
                      className="w-7 h-7 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground"
                      title="Adicionar opção"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {value.options.map((o) => (
                      <span key={o} className="px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-medium">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-full text-sm text-primary hover:underline text-left py-3 border border-dashed border-border rounded-lg px-3"
                >
                  + Criar nova variação
                </button>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button className="w-full" onClick={() => onOpenChange(false)}>Concluir</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={() => setView('list')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h2 className="font-semibold text-foreground text-sm">Adicionar variação</h2>
              <span className="w-12" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Nome da variação</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder='Exemplo: "Cor"'
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Opções</Label>
                <p className="text-[11px] text-muted-foreground">Exemplo: "Azul", "Amarelo"</p>
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={o}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Opção ${i + 1}`}
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeOption(i)} className="text-destructive shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  + Adicionar nova opção
                </button>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VariationsModal;
