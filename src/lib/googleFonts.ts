// Lista de Google Fonts disponíveis para personalização do catálogo.
export const TITLE_FONTS = [
  'Inter', 'Playfair Display', 'Rubik', 'Source Serif Pro', 'Montserrat',
  'Poppins', 'Taviraj', 'IBM Plex Mono', 'Exo 2', 'Fredoka', 'Kaushan Script',
];
export const BODY_FONTS = [
  'Inter', 'DM Sans', 'Roboto', 'Rubik', 'Montserrat', 'Taviraj',
  'Playfair Display', 'Exo 2', 'Crimson Text', 'IBM Plex Mono',
];

let injected = false;
export function injectCatalogFonts(fonts: string[]) {
  if (typeof document === 'undefined') return;
  const unique = Array.from(new Set(fonts.filter(Boolean)));
  const id = 'catalog-google-fonts';
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  const families = unique
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  if (existing) {
    if (existing.href !== href) existing.href = href;
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.id = id;
  link.href = href;
  document.head.appendChild(link);
  injected = true;
}
