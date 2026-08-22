import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CatalogConfig, TEXT_LIMITS } from '@/lib/catalogBuilder/types';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
}

const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const FooterSection: React.FC<Props> = ({ config, update }) => {
  const footer = config.footer ?? { showCnpj: false, cnpj: '' };
  const set = (patch: Partial<typeof footer>) =>
    update((c) => ({ ...c, footer: { ...(c.footer ?? { showCnpj: false, cnpj: '' }), ...patch } }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="show-cnpj" className="text-xs">Exibir CNPJ no rodapé</Label>
          <p className="text-[11px] text-muted-foreground">
            O CNPJ aparece centralizado ao final do catálogo.
          </p>
        </div>
        <Switch
          id="show-cnpj"
          checked={footer.showCnpj}
          onCheckedChange={(v) => set({ showCnpj: v })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cnpj" className="text-xs">CNPJ da empresa</Label>
        <Input
          id="cnpj"
          value={footer.cnpj}
          maxLength={TEXT_LIMITS.cnpj}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          disabled={!footer.showCnpj}
          onChange={(e) => set({ cnpj: maskCnpj(e.target.value) })}
          className="h-9"
        />
      </div>
    </div>
  );
};

export default FooterSection;
