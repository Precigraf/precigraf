import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useCatalogSettings } from '@/hooks/useCatalog';
import { useToast } from '@/hooks/use-toast';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

export const CatalogSettingsForm: React.FC = () => {
  const { settings, upsert } = useCatalogSettings();
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [template, setTemplate] = useState('');
  const [primary, setPrimary] = useState('#534AB7');

  useEffect(() => {
    if (settings) {
      setSlug(settings.slug);
      setIsActive(settings.is_active);
      setTemplate(settings.whatsapp_message_template);
      setPrimary(settings.primary_color);
    }
  }, [settings]);

  const publicUrl = settings?.slug
    ? `${window.location.origin}/catalogo/${settings.slug}`
    : '';

  const handleSave = () => {
    const clean = slugify(slug);
    if (clean.length < 3) {
      toast({ title: 'Slug inválido', description: 'Use pelo menos 3 caracteres (letras, números ou hífen).', variant: 'destructive' });
      return;
    }
    upsert.mutate({
      slug: clean,
      is_active: isActive,
      whatsapp_message_template: template,
      primary_color: primary,
    });
  };

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Configurações do catálogo</h3>
        <p className="text-sm text-muted-foreground">Defina o link público e a mensagem enviada pelo WhatsApp.</p>
      </div>

      <div className="space-y-2">
        <Label>URL pública (slug)</Label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center rounded-lg border border-border bg-input pl-3">
            <span className="text-sm text-muted-foreground">/catalogo/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="minha-grafica"
              className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0"
            />
          </div>
        </div>
        {publicUrl && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast({ title: 'Link copiado!' });
              }}
            >
              <Copy className="w-3 h-3 mr-1" /> Copiar link
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" /> Abrir
              </a>
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Catálogo ativo</Label>
          <p className="text-xs text-muted-foreground">Quando desativado, o link público mostra "não encontrado".</p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="space-y-2">
        <Label>Cor principal</Label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer"
          />
          <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="max-w-[140px]" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mensagem do WhatsApp</Label>
        <Textarea
          rows={6}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Use {loja}, {itens} e {total}"
        />
        <p className="text-xs text-muted-foreground">
          Variáveis: <code>{'{loja}'}</code>, <code>{'{itens}'}</code>, <code>{'{total}'}</code>
        </p>
      </div>

      <Button onClick={handleSave} disabled={upsert.isPending}>
        {upsert.isPending ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </Card>
  );
};
