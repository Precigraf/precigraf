import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, RotateCcw, Trash2, Upload } from 'lucide-react';
import { CatalogConfig, TEXT_LIMITS } from '@/lib/catalogBuilder/types';
import { LimitedInput } from '../EditorFields';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/catalogBuilder/storage';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
  onUploadPhoto: (file: File) => Promise<void>;
  onRemovePhoto: () => Promise<void>;
  titleError?: string | null;
}

const MIN_GOOD_WIDTH = 900;

const ProductSection: React.FC<Props> = ({ config, update, onUploadPhoto, onRemovePhoto, titleError }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { product } = config;
  const t = product.imageTransform;

  const setTransform = (patch: Partial<typeof t>) =>
    update((c) => ({
      ...c,
      product: { ...c.product, imageTransform: { ...c.product.imageTransform, ...patch } },
    }));

  const lowRes = !!product.imageUrl && !!product.imageWidth && product.imageWidth < MIN_GOOD_WIDTH;

  return (
    <div className="space-y-4">
      <LimitedInput
        id="product-title"
        label="Título principal"
        value={product.title}
        maxLength={TEXT_LIMITS.productTitle}
        placeholder="SACOLA"
        error={titleError}
        onChange={(v) => update((c) => ({ ...c, product: { ...c.product, title: v } }))}
      />
      <LimitedInput
        id="product-highlight"
        label="Palavra de destaque"
        value={product.highlight}
        maxLength={TEXT_LIMITS.productHighlight}
        placeholder="MINI"
        onChange={(v) => update((c) => ({ ...c, product: { ...c.product, highlight: v } }))}
      />
      <LimitedInput
        id="product-subtitle"
        label="Complemento"
        value={product.subtitle}
        maxLength={TEXT_LIMITS.productSubtitle}
        placeholder="PERSONALIZADA"
        onChange={(v) => update((c) => ({ ...c, product: { ...c.product, subtitle: v } }))}
      />

      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-xs">Fotografia do produto</Label>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-md border border-border bg-muted/40 overflow-hidden shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="Fotografia do produto" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Upload className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
              {product.imageUrl ? 'Substituir' : 'Enviar foto'}
            </Button>
            {product.imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onRemovePhoto();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Remover
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              await onUploadPhoto(file);
            } finally {
              setBusy(false);
              if (inputRef.current) inputRef.current.value = '';
            }
          }}
        />

        {lowRes && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-[11px]">
              Esta imagem pode perder qualidade na exportação.
            </AlertDescription>
          </Alert>
        )}

        {product.imageUrl && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs">Zoom</Label>
                <span className="text-[10px] text-muted-foreground tabular-nums">{t.zoom.toFixed(2)}x</span>
              </div>
              <Slider
                value={[t.zoom]}
                min={1}
                max={3}
                step={0.01}
                aria-label="Zoom da fotografia"
                onValueChange={([v]) => setTransform({ zoom: v })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs">Posição horizontal</Label>
                <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(t.x)}%</span>
              </div>
              <Slider
                value={[t.x]}
                min={0}
                max={100}
                step={1}
                aria-label="Posição horizontal da fotografia"
                onValueChange={([v]) => setTransform({ x: v })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs">Posição vertical</Label>
                <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(t.y)}%</span>
              </div>
              <Slider
                value={[t.y]}
                min={0}
                max={100}
                step={1}
                aria-label="Posição vertical da fotografia"
                onValueChange={([v]) => setTransform({ y: v })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTransform({ zoom: 1, x: 50, y: 50 })}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Redefinir enquadramento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSection;
