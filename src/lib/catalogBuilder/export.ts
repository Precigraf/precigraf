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

/** Dimensões reais do nó renderizado (a altura cresce com o conteúdo). */
function measure(node: HTMLElement) {
  return {
    width: Math.max(Math.round(node.scrollWidth), CATALOG_WIDTH),
    height: Math.max(Math.round(node.scrollHeight), CATALOG_HEIGHT),
  };
}

const baseOptions = (o: RenderOptions, size: { width: number; height: number }) => ({
  width: size.width,
  height: size.height,
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
  const size = measure(node);
  // Primeira passada aquece o cache de fontes/imagens do html-to-image.
  if (format === 'png') {
    await toPng(node, { ...baseOptions(options, size), pixelRatio: 1 });
    return toPng(node, baseOptions(options, size));
  }
  await toJpeg(node, { ...baseOptions(options, size), pixelRatio: 1, quality: 0.9 });
  return toJpeg(node, { ...baseOptions(options, size), quality: 0.94 });
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
    const { width, height } = measure(node);
    const pdf = new jsPDF({
      orientation: width >= height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height],
      compress: true,
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST');
    pdf.save(`${safeName}.pdf`);
    return;
  }

  const dataUrl = await renderCatalogImage(node, format, { backgroundColor, pixelRatio });
  downloadDataUrl(dataUrl, `${safeName}.${format === 'jpeg' ? 'jpg' : 'png'}`);
}
