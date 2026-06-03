import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { useCatalogBanners, type CatalogBanner } from '@/hooks/useCatalog';

const PRESET_COLORS = ['#26215C', '#04342C', '#412402', '#1E3A8A', '#7C2D12', '#581C87'];

const BannerRow: React.FC<{ banner: CatalogBanner }> = ({ banner }) => {
  const { update, remove } = useCatalogBanners();
  const [b, setB] = useState(banner);

  const save = () => update.mutate({ id: b.id, ...b });

  return (
    <Card className="p-4 space-y-3" style={{ borderLeftWidth: 4, borderLeftColor: b.bg_color }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Eyebrow</Label>
          <Input value={b.eyebrow ?? ''} onChange={(e) => setB({ ...b, eyebrow: e.target.value })} placeholder="Promoção da semana" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} className="h-9" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Subtítulo</Label>
          <Input value={b.subtitle ?? ''} onChange={(e) => setB({ ...b, subtitle: e.target.value })} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CTA (texto)</Label>
          <Input value={b.cta_label ?? ''} onChange={(e) => setB({ ...b, cta_label: e.target.value })} placeholder="Ver oferta" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CTA (link)</Label>
          <Input value={b.cta_url ?? ''} onChange={(e) => setB({ ...b, cta_url: e.target.value })} placeholder="https://..." className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cor de fundo</Label>
          <div className="flex gap-1 flex-wrap items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setB({ ...b, bg_color: c })}
                className={`w-7 h-7 rounded-full border-2 ${b.bg_color === c ? 'border-foreground' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
            <input type="color" value={b.bg_color} onChange={(e) => setB({ ...b, bg_color: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ordem</Label>
          <Input type="number" value={b.sort_order} onChange={(e) => setB({ ...b, sort_order: parseInt(e.target.value) || 0 })} className="h-9" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Switch checked={b.is_active} onCheckedChange={(v) => setB({ ...b, is_active: v })} />
          <span className="text-sm text-muted-foreground">Ativo</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate(b.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={save} disabled={update.isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const BannerManager: React.FC = () => {
  const { banners, create } = useCatalogBanners();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Banners</h3>
          <p className="text-sm text-muted-foreground">Slides promocionais exibidos no topo do catálogo.</p>
        </div>
        <Button onClick={() => create.mutate({ title: 'Novo banner', subtitle: 'Subtítulo', eyebrow: 'Destaque' })}>
          <Plus className="w-4 h-4 mr-1" /> Novo banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum banner cadastrado.</Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <BannerRow key={b.id} banner={b} />
          ))}
        </div>
      )}
    </div>
  );
};
