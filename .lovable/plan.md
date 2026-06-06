# Plano: Personalização, Categorias, Imagens e Limpeza

## 1. Remover aba "Banners"
- Remover item "Banners" de `CatalogoSubNav.tsx`.
- Remover rota `/catalogo-admin/banners` em `App.tsx`.
- Excluir `src/pages/CatalogoBanners.tsx` e `src/components/catalogo/BannerManager.tsx`.
- Banners passam a ser gerenciados dentro da nova aba "Personalizar" (item 4).

## 2. CRUD completo de Categorias e Subcategorias
Substituir o `CatalogCategoryChips` (que mistura filtro + edição) por um gerenciador dedicado dentro da aba "Catálogo", com:
- Lista hierárquica (pai → filhos) com expand/collapse.
- Criar categoria pai e subcategoria (campo `parent_id` já existe).
- Renomear inline.
- Reordenar via setas ↑/↓ atualizando `sort_order` no banco.
- Toggle de ativar/desativar (`is_active`) — categorias inativas não aparecem no público.
- Remover (com confirmação; produtos da categoria ficam sem categoria).
- Filtro de produtos por categoria continua via chips simples acima da lista.

Hook `useCatalogCategories` ganha mutação `reorder(ids: string[])` que atualiza `sort_order` em lote.

## 3. Upload aprimorado de imagens (até 5, 1080×1080)
No `CatalogProductForm.tsx`:
- Validar `file.type` (apenas `image/jpeg`, `image/png`, `image/webp`).
- Validar tamanho (≤ 8 MB antes da compressão).
- Aumentar compressão para 1080 px (`compressImage(f, 1080, 0.88)`).
- Pré-visualização com badge da ordem (1/5, 2/5…), botão para remover individual e para reordenar (drag opcional; setas como fallback).
- Mostrar dica "Recomendado 1080×1080 px (JPG, PNG ou WebP, até 8MB)".
- Bloquear botão de upload quando já houver 5 imagens, com mensagem clara.

## 4. Renomear "Configurações" → "Personalizar" e rebuild completo
Renomear a aba e a rota:
- Sub-nav: label "Personalizar", ícone `Palette`.
- Rota: `/catalogo-admin/personalizar` (mantém `/configuracoes` redirecionando para compatibilidade).
- Página: `CatalogoPersonalizar.tsx` substitui `CatalogoConfiguracoes.tsx`.

### Novos campos de personalização (baseados na imagem)
Estendidos em `catalog_settings`:

**Geral**
- `primary_color` (já existe)

**Cabeçalho**
- `header_bg_color`
- `header_text_color`

**Fontes** (Google Fonts pré-selecionadas: Inter, Playfair Display, Rubik, Source Serif, Montserrat, Poppins, Taviraj, IBM Plex Mono, Exo 2, Fredoka, Kaushan Script, DM Sans, Roboto, Crimson)
- `title_font` (string)
- `title_weight` ('light' | 'medium' | 'bold')
- `body_font` (string)
- `title_color`
- `price_color`

**Lista de produtos**
- `product_image_shape` ('square' | 'rectangle' | 'full')
- `product_border_style` ('straight' | 'rounded')
- `product_text_align` ('left' | 'center')
- `product_name_case` ('uppercase' | 'normal')
- `product_buy_button` ('below' | 'none')

**Botões**
- `button_border_style` ('rounded' | 'straight' | 'pill')
- `button_bg_color`
- `button_text_color`

**Banners (mesclados aqui)**
- Subseção com gerenciador `BannerManager` existente, mas integrado nesta página (campos: upload de imagem mobile, upload de imagem desktop; tamanho recomendado 562×300). Migração: adicionar `image_mobile_url`, `image_desktop_url`, `storage_path_mobile`, `storage_path_desktop` em `catalog_banners`.

**Modelo (visual apenas, por enquanto)**
- `template` ('catalog' | 'shop') — apenas armazenado, "Catálogo" é o único renderizado nesta fase.

### Estrutura UI (mobile-first, accordions)
Página em accordions seguindo a imagem: Design (Modelo + Banners), Personalizar estilo (Geral, Cabeçalho, Fontes, Lista de produtos, Botões). Mais ao fim: Slug, Catálogo ativo, Mensagem WhatsApp (seções existentes preservadas).

### Sincronização instantânea com o catálogo público
- RPC `get_public_catalog` atualizada para devolver todos os novos campos em `store`.
- `CatalogoPublico.tsx` lê esses campos e aplica via CSS variables (`--catalog-primary`, `--catalog-header-bg`, `--catalog-header-fg`, `--catalog-title-color`, `--catalog-price-color`, `--catalog-button-bg`, `--catalog-button-fg`, raios, alinhamento, case, etc.).
- Fontes carregadas dinamicamente via `<link>` injetado no head conforme `title_font`/`body_font`.
- Auto-save com debounce (~600 ms) por campo: ao soltar/alterar, salva e re-renderiza preview em tempo real do mesmo lado (preview embutido no painel, opcional nesta fase).
- Para o público, alterações refletem na próxima abertura/recarregamento (React Query revalida; sem websockets nesta fase).

## 5. Migrações de banco
Uma única migration:
- `ALTER TABLE catalog_settings ADD COLUMN ...` (todos os campos acima com defaults sensatos).
- `ALTER TABLE catalog_banners ADD COLUMN image_mobile_url text, image_desktop_url text, storage_path_mobile text, storage_path_desktop text`.
- Substituir RPC `get_public_catalog` para incluir os novos campos em `store` e considerar `is_active` em categorias.
- Bucket `catalog-images` reaproveitado para imagens de banner.

## 6. Out of scope
- Editor visual "WYSIWYG" lado a lado completo (apresenta apenas controles + preview do catálogo público em nova aba).
- Modelo "Loja virtual profissional" (apenas o seletor é exibido, sem renderização alternativa).
- Reordenação por drag-and-drop nativo (usaremos setas para evitar dependência extra).

## Técnico — Arquivos afetados
- **Criar**: `src/pages/CatalogoPersonalizar.tsx`, `src/components/catalogo/personalize/{GeneralSection,HeaderSection,FontsSection,ProductListSection,ButtonsSection,BannersSection,SlugSection,WhatsAppSection}.tsx`, `src/components/catalogo/CategoryManager.tsx`, `src/lib/googleFonts.ts`.
- **Editar**: `CatalogoSubNav.tsx`, `App.tsx`, `CatalogoAdmin.tsx`, `CatalogProductsManager.tsx` (usa novo CategoryManager + chips simplificados), `CatalogProductForm.tsx` (validação/imagens), `useCatalog.ts` (tipos + campos), `useCatalogProducts.ts` (mutação reorder de categoria), `CatalogoPublico.tsx` (aplica todas as variáveis de estilo).
- **Excluir**: `CatalogoBanners.tsx`, `BannerManager.tsx` antigo (substituído por `BannersSection` integrado), `CatalogoConfiguracoes.tsx` (substituído).
- **Migração SQL**: novos campos em `catalog_settings` e `catalog_banners`, RPC atualizada.
