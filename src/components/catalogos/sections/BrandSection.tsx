import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { BrandHeaderLayout, CatalogConfig, TEXT_LIMITS } from '@/lib/catalogBuilder/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LimitedInput } from '../EditorFields';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/catalogBuilder/storage';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
  onUploadLogo: (file: File) => Promise<void>;
  onRemoveLogo: () => Promise<void>;
}

const BrandSection: React.FC<Props> = ({ config, update, onUploadLogo, onRemoveLogo }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { brand } = config;

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      await onUploadLogo(file);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Logotipo</Label>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-md border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="Logotipo da marca" className="w-full h-full object-contain" />
            ) : (
              <Upload className="w-4 h-4 text-muted-foreground" />
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
              {brand.logoUrl ? 'Substituir' : 'Enviar logo'}
            </Button>
            {brand.logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onRemoveLogo();
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
        <p className="text-[11px] text-muted-foreground">
          PNG, JPG, JPEG ou WebP até 5 MB. Prefira PNG com fundo transparente e pelo menos 500 px de largura.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      <LimitedInput
        id="brand-name"
        label="Nome da marca"
        value={brand.name}
        maxLength={TEXT_LIMITS.brandName}
        onChange={(v) => update((c) => ({ ...c, brand: { ...c.brand, name: v } }))}
      />

      <LimitedInput
        id="brand-slogan"
        label="Slogan"
        value={brand.slogan}
        maxLength={TEXT_LIMITS.slogan}
        onChange={(v) => update((c) => ({ ...c, brand: { ...c.brand, slogan: v } }))}
      />

      <div className="space-y-2">
        <Label className="text-xs">Layout do cabeçalho</Label>
        <Select
          value={brand.headerLayout ?? 'centered'}
          onValueChange={(v) =>
            update((c) => ({ ...c, brand: { ...c.brand, headerLayout: v as BrandHeaderLayout } }))
          }
        >
          <SelectTrigger className="h-9" aria-label="Layout do cabeçalho">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="centered">Centralizado</SelectItem>
            <SelectItem value="side">Lateral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-logo" className="text-xs">Mostrar logo</Label>
        <Switch
          id="show-logo"
          checked={brand.showLogo}
          onCheckedChange={(v) => update((c) => ({ ...c, brand: { ...c.brand, showLogo: v } }))}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-name" className="text-xs">Mostrar nome da marca</Label>
        <Switch
          id="show-name"
          checked={brand.showName !== false}
          onCheckedChange={(v) => update((c) => ({ ...c, brand: { ...c.brand, showName: v } }))}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-slogan" className="text-xs">Mostrar slogan</Label>
        <Switch
          id="show-slogan"
          checked={brand.showSlogan}
          onCheckedChange={(v) => update((c) => ({ ...c, brand: { ...c.brand, showSlogan: v } }))}
        />
      </div>
    </div>
  );
};

export default BrandSection;
