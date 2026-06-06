// Feature flags / allowlists para funcionalidades em construção.
// O Catálogo (admin) está em construção e visível apenas para os e-mails abaixo.
export const CATALOG_ALLOWED_EMAILS = [
  'israelwanderley65@gmail.com',
];

export const canAccessCatalog = (email?: string | null): boolean => {
  if (!email) return false;
  return CATALOG_ALLOWED_EMAILS.includes(email.trim().toLowerCase());
};
