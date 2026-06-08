import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { CatalogoSubNav } from '@/components/catalogo/CatalogoSubNav';
import { CoverBannerManager } from '@/components/catalogo/CoverBannerManager';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Loader2, MessageCircle, Settings } from 'lucide-react';
import { useCatalogSettings, type CatalogSettings } from '@/hooks/useCatalog';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useToast } from '@/hooks/use-toast';
import { TITLE_FONTS, BODY_FONTS, injectCatalogFonts } from '@/lib/googleFonts';
import { PUBLIC_BASE_HOST, buildCatalogUrl } from '@/lib/publicUrl';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

type Draft = Partial<CatalogSettings> & { slug: string };

const DEFAULTS: Draft = {
  slug: '',
  is_active: true,
  whatsapp_message_template: 'Olá {loja}! Quero fazer um pedido:\n\n{itens}\n\nTotal: {total}',
  primary_color: '#534AB7',
  template: 'catalog',
  header_bg_color: '#534AB7',
  header_text_color: '#FFFFFF',
  title_font: 'Inter',
  title_weight: 'bold',
  body_font: 'Inter',
  title_color: '#111827',
  price_color: '#534AB7',
  product_image_shape: 'square',
  product_border_style: 'rounded',
  product_text_align: 'left',
  product_name_case: 'normal',
  product_buy_button: 'below',
  button_border_style: 'pill',
  button_bg_color: '#534AB7',
  button_text_color: '#FFFFFF',
};

const Color: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <div className="flex gap-2 items-center">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 rounded border border-border bg-transparent cursor-pointer" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs max-w-[120px]" />
    </div>
  </div>
);

const Pills: React.FC<{ value: string; onChange: (v: any) => void; options: Array<{ value: string; label: string }> }> =
  ({ value, onChange, options }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition ${
            value === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );

const CatalogoPersonalizar: React.FC = () => {
  const { settings, upsert } = useCatalogSettings();
  const { profile } = useCompanyProfile();
  const { toast } = useToast();
  const [d, setD] = useState<Draft>(DEFAULTS);

  useEffect(() => {
    if (settings) setD({ ...DEFAULTS, ...settings });
  }, [settings]);

  useEffect(() => {
    injectCatalogFonts([d.title_font, d.body_font].filter(Boolean) as string[]);
  }, [d.title_font, d.body_font]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const publicUrl = d.slug ? buildCatalogUrl(d.slug) : '';
  const displayUrl = d.slug ? `${PUBLIC_BASE_HOST}/${d.slug}` : '';
  const storeWhats = profile?.whatsapp ?? null;

  const handleSave = () => {
    const clean = slugify(d.slug || '');
    if (clean.length < 3) {
      toast({ title: 'Slug inválido', description: 'Use ao menos 3 caracteres.', variant: 'destructive' });
      return;
    }
    upsert.mutate({ ...d, slug: clean }, {
      onSuccess: () => toast({ title: 'Personalização salva' }),
    });
  };

  return (
    <AppLayout>
      <CatalogoSubNav />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Personalizar</h1>
            <p className="text-sm text-muted-foreground">Defina o visual e o link público do seu catálogo.</p>
          </div>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Salvar alterações
          </Button>
        </div>

        {/* Seu Link (catálogo) + ativar */}
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Seu Link (catálogo)</Label>
            <div className="flex items-center rounded-lg border border-border bg-input pl-3">
              <span className="text-sm text-muted-foreground">{PUBLIC_BASE_HOST}/</span>
              <Input value={d.slug} onChange={(e) => set('slug', e.target.value)}
                placeholder="minhaloja"
                className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0" />
            </div>
            {displayUrl && (
              <>
                <p className="text-xs text-muted-foreground pt-1">
                  Compartilhe: <span className="font-medium text-foreground">{displayUrl}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(publicUrl); toast({ title: 'Link copiado!' });
                  }}>
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" /> Abrir
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Catálogo ativo</Label>
              <p className="text-xs text-muted-foreground">Desativado: link público mostra "não encontrado".</p>
            </div>
            <Switch checked={!!d.is_active} onCheckedChange={(v) => set('is_active', v)} />
          </div>
        </Card>

        {/* Imagem de capa (banner) */}
        <CoverBannerManager />

        <Accordion type="multiple" defaultValue={['estilo']} className="space-y-3">


          {/* Personalizar estilo */}
          <AccordionItem value="estilo" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-sm font-semibold">Personalizar estilo</AccordionTrigger>
            <AccordionContent className="space-y-6 pb-4">
              {/* Geral */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold">Geral</h4>
                <Color label="Cor principal" value={d.primary_color!} onChange={(v) => set('primary_color', v)} />
              </section>

              {/* Cabeçalho */}
              <section className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold">Cabeçalho</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Color label="Cor de fundo do cabeçalho" value={d.header_bg_color!} onChange={(v) => set('header_bg_color', v)} />
                  <Color label="Cor dos textos do cabeçalho" value={d.header_text_color!} onChange={(v) => set('header_text_color', v)} />
                </div>
              </section>

              {/* Fontes */}
              <section className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold">Fontes</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Fonte dos títulos</Label>
                  <div className="flex flex-wrap gap-2">
                    {TITLE_FONTS.map((f) => (
                      <button key={f} onClick={() => set('title_font', f)}
                        style={{ fontFamily: `'${f}', sans-serif` }}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                          d.title_font === f ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                        }`}>
                        Text<div className="text-[10px] opacity-70" style={{ fontFamily: 'Inter' }}>{f}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Peso dos títulos</Label>
                  <Pills value={d.title_weight ?? 'bold'} onChange={(v) => set('title_weight', v)} options={[
                    { value: 'light', label: 'Fina' },
                    { value: 'medium', label: 'Média' },
                    { value: 'bold', label: 'Grossa' },
                  ]} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fonte dos parágrafos</Label>
                  <div className="flex flex-wrap gap-2">
                    {BODY_FONTS.map((f) => (
                      <button key={f} onClick={() => set('body_font', f)}
                        style={{ fontFamily: `'${f}', sans-serif` }}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                          d.body_font === f ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                        }`}>
                        Text<div className="text-[10px] opacity-70" style={{ fontFamily: 'Inter' }}>{f}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Color label="Cor dos títulos" value={d.title_color!} onChange={(v) => set('title_color', v)} />
                  <Color label="Cor dos preços" value={d.price_color!} onChange={(v) => set('price_color', v)} />
                </div>
              </section>

              {/* Lista de produtos */}
              <section className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold">Lista de produtos</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Formato das imagens</Label>
                  <Pills value={d.product_image_shape ?? 'square'} onChange={(v) => set('product_image_shape', v)} options={[
                    { value: 'square', label: 'Quadrado' },
                    { value: 'rectangle', label: 'Retângular' },
                    { value: 'full', label: 'Tela cheia' },
                  ]} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estilo de bordas</Label>
                  <Pills value={d.product_border_style ?? 'rounded'} onChange={(v) => set('product_border_style', v)} options={[
                    { value: 'straight', label: 'Retas' },
                    { value: 'rounded', label: 'Arredondadas' },
                  ]} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Alinhamento do texto</Label>
                  <Pills value={d.product_text_align ?? 'left'} onChange={(v) => set('product_text_align', v)} options={[
                    { value: 'left', label: 'Esquerda' },
                    { value: 'center', label: 'Centro' },
                  ]} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estilo de nome do produto</Label>
                  <Pills value={d.product_name_case ?? 'normal'} onChange={(v) => set('product_name_case', v)} options={[
                    { value: 'uppercase', label: 'Somente maiúsculas' },
                    { value: 'normal', label: 'Normal' },
                  ]} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Botão de comprar</Label>
                  <Pills value={d.product_buy_button ?? 'below'} onChange={(v) => set('product_buy_button', v)} options={[
                    { value: 'below', label: 'Abaixo do produto' },
                    { value: 'none', label: 'Sem botão' },
                  ]} />
                </div>
              </section>

              {/* Botões */}
              <section className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold">Botões</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Estilo da borda de botões</Label>
                  <Pills value={d.button_border_style ?? 'pill'} onChange={(v) => set('button_border_style', v)} options={[
                    { value: 'rounded', label: 'Arredondada' },
                    { value: 'straight', label: 'Reta' },
                    { value: 'pill', label: 'Circular' },
                  ]} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Color label="Cor de fundo" value={d.button_bg_color!} onChange={(v) => set('button_bg_color', v)} />
                  <Color label="Cor do texto" value={d.button_text_color!} onChange={(v) => set('button_text_color', v)} />
                </div>
              </section>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        {/* WhatsApp info — vem das Configurações da Empresa */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-medium text-foreground text-sm">
                WhatsApp do catálogo: {storeWhats ? storeWhats : <span className="text-destructive">não configurado</span>}
              </div>
              <p className="text-muted-foreground mt-0.5">
                Os pedidos do catálogo são enviados para o WhatsApp cadastrado nas Configurações da Empresa.
              </p>
              <Button asChild variant="link" size="sm" className="px-0 h-auto mt-1">
                <Link to="/perfil">
                  <Settings className="w-3 h-3 mr-1" />
                  Editar em Configurações da empresa
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-3 z-10">
          <Button onClick={handleSave} disabled={upsert.isPending} className="w-full h-11 shadow-lg">
            {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CatalogoPersonalizar;
