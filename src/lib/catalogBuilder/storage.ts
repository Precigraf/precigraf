import { supabase } from '@/integrations/supabase/client';

export const BUCKET = 'catalog-builder';

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface UploadedImage {
  url: string;
  path: string;
  width: number;
  height: number;
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato inválido. Use PNG, JPG, JPEG ou WebP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Arquivo muito grande. O limite é 5 MB.';
  }
  return null;
}

export function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function uploadCatalogImage(
  userId: string,
  catalogId: string,
  kind: 'logo' | 'product',
  file: File,
): Promise<UploadedImage> {
  const error = validateImage(file);
  if (error) throw new Error(error);

  const { width, height } = await readImageSize(file);
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${userId}/${catalogId}/${kind}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, width, height };
}

export async function removeCatalogImage(path: string | null | undefined) {
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // arquivo já removido — ignora
  }
}
