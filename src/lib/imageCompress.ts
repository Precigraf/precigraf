// Comprime e redimensiona imagem no client antes do upload.
// Reduz drasticamente o tamanho (1-5 MB -> ~30-80 KB) e acelera upload.
export async function compressImage(
  file: File,
  maxSize = 512,
  quality = 0.82
): Promise<Blob> {
  // SVGs não devem ser recomprimidos
  if (file.type === 'image/svg+xml') return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  // Tenta WebP, fallback PNG (preserva transparência se for PNG)
  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const mime = supportsWebp ? 'image/webp' : (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );
  return blob ?? file;
}
