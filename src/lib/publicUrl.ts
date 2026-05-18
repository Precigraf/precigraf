// Base URL pública usada em links compartilhados (orçamentos, rastreio, etc.)
// Configurável via VITE_PUBLIC_BASE_URL; fallback fixo para o domínio oficial.
export const PUBLIC_BASE_URL: string = (
  (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim() ||
  'https://precigraf.com.br'
).replace(/\/$/, '');

export const buildPublicUrl = (path: string): string => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_BASE_URL}${p}`;
};

export const buildQuoteApprovalUrl = (token: string): string =>
  buildPublicUrl(`/orcamento/${token}`);

export const buildOrderTrackingUrl = (token: string): string =>
  buildPublicUrl(`/pedido/${token}`);

export const buildClientPortalUrl = (token: string): string =>
  buildPublicUrl(`/cliente/${token}`);

