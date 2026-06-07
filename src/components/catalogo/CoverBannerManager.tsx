import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCatalogBanners, type CatalogBanner } from '@/hooks/useCatalog';
import { compressImage } from '@/lib/imageCompress';

const MAX_BANNERS = 3;
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export const CoverBannerManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { banners, create, update, remove } = useCatalogBanners();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const count = banners.length;

  const handleFile = async (file: File) => {
    if (!user) return;
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG ou WebP.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 2 MB.', variant: 'destructive' });
      return;
    }
    if (count >= MAX_BANNERS) {
      toast({ title: 'Limite atingido', description: `Máximo de ${MAX_BANNERS} imagens.`, variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const blob = await compressImage(file, 1500, 0.88);
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const path = `${user.id}/banner/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('catalog-images')
        .upload(path, blob, { upsert: false, contentType: blob.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('catalog-images').getPublicUrl(path);
      const payload: Record<string, unknown> = {
        title: '',
        eyebrow: null,
        subtitle: null,
        bg_color: '#000000',
        sort_order: count,
        is_active: true,
        image_desktop_url: pub.publicUrl,
        image_mobile_url: pub.publicUrl,
        storage_path_desktop: path,
      };
      await create.mutateAsync(payload as Partial<CatalogBanner>);
    } catch (e: any) {
      toast({ title: 'Erro no upload', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (b: any) => {
    const path = b.storage_path_desktop;
    if (path) {
      await supabase.storage.from('catalog-images').remove([path]);
    }
    remove.mutate(b.id);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Imagem de Capa</div>
          <p className="text-xs text-muted-foreground">Banner principal do seu catálogo</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {count === 0 ? 'Sem imagem' : `${count}/${MAX_BANNERS}`}
        </span>
      </div>

      {count === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg py-12 flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">Nenhuma imagem de capa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {banners.map((b: any, i) => (
            <div key={b.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-[3/1]">
              {b.image_desktop_url ? (
                <img src={b.image_desktop_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}/{MAX_BANNERS}</span>
              <button
                onClick={() => handleRemove(b)}
                className="absolute top-1.5 right-1.5 bg-destructive text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={uploading || count >= MAX_BANNERS}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
        {count >= MAX_BANNERS ? 'Limite atingido' : 'Adicionar imagem'}
      </Button>

    </Card>
  );
};

export default CoverBannerManager;
