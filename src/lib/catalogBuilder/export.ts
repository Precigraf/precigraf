import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CATALOG_HEIGHT, CATALOG_WIDTH, sanitizeFileName } from './types';

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

async function waitForAssets(node: HTMLElement) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignora */
    }
  }
  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
          setTimeout(resolve, 8000);
        }),
    ),
  );
}

interface RenderOptions {
  pixelRatio?: number;
  backgroundColor: string;
}

const baseOptions = (o: RenderOptions) => ({
  width: CATALOG_WIDTH,
  height: CATALOG_HEIGHT,
  pixelRatio: o.pixelRatio ?? 2,
  cacheBust: true,
  backgroundColor: o.backgroundColor,
  style: {
    transform: 'none',
    transformOrigin: 'top left',
    margin: '0',
  },
});

export async function renderCatalogImage(
  node: HTMLElement,
  format: 'png' | 'jpeg',
  options: RenderOptions,
): Promise<string> {
  await waitForAssets(node);
  // Primeira passada aquece o cache de fontes/imagens do html-to-image.
  if (format === 'png') {
    await toPng(node, { ...baseOptions(options), pixelRatio: 1 });
    return toPng(node, baseOptions(options));
  }
  await toJpeg(node, { ...baseOptions(options), pixelRatio: 1, quality: 0.9 });
  return toJpeg(node, { ...baseOptions(options), quality: 0.94 });
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportCatalog(
  node: HTMLElement,
  format: ExportFormat,
  fileName: string,
  backgroundColor: string,
  pixelRatio = 2,
) {
  const safeName = sanitizeFileName(fileName);

  if (format === 'pdf') {
    const dataUrl = await renderCatalogImage(node, 'png', { backgroundColor, pixelRatio });
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [CATALOG_WIDTH, CATALOG_HEIGHT],
      compress: true,
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, CATALOG_WIDTH, CATALOG_HEIGHT, undefined, 'FAST');
    pdf.save(`${safeName}.pdf`);
    return;
  }

  const dataUrl = await renderCatalogImage(node, format, { backgroundColor, pixelRatio });
  downloadDataUrl(dataUrl, `${safeName}.${format === 'jpeg' ? 'jpg' : 'png'}`);
}
