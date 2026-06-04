# Catálogo: nova sub-navegação + cadastro de produtos

## Objetivo
Quando o usuário clica em **Catálogo** na sidebar, o app entra em uma nova área com sub-menus próprios:

1. **Catálogo** (novo) — gestão de produtos exclusivos do catálogo público, com categorias + subcategorias.
2. **Banners** — o que hoje está em "Banners" no `/catalogo-admin`.
3. **Destaques** — o que hoje está em "Destaques".
4. **Configurações** — slug, cor, template do WhatsApp.

A vitrine pública `/catalogo/:slug` continua igual, mas passa a ler dos novos produtos de catálogo (não dos produtos do calculador).

## Decisões já confirmadas
- Subcategorias via `parent_id` (hierarquia de 1 nível pai → filhas).
- Produtos do catálogo são **separados** dos produtos do calculador (`/produtos` segue intacto).
- Variações **completas**: cada variação tem nome, preço próprio e estoque próprio.
- Imagens carregadas do computador do usuário, até 5 por produto.

## Banco de dados (1 migração)

Novas tabelas (todas com RLS `auth.uid() = user_id`, grants `authenticated` + `service_role`):

- **`catalog_product_categories`** — `id`, `user_id`, `parent_id` (self-ref, nullable), `name`, `sort_order`, `is_active`.
- **`catalog_products`** — `id`, `user_id`, `name`, `description`, `price`, `promo_price`, `category_id`, `is_active`, `is_featured`, `stock` (opcional), `sort_order`.
- **`catalog_product_variants`** — `id`, `product_id`, `name` (ex: "Vermelho - P"), `price`, `stock`, `sort_order`.
- **`catalog_product_images`** — `id`, `product_id`, `url`, `sort_order` (máx 5 por produto via trigger).

Atualizar a RPC `get_public_catalog(p_slug)` para devolver os novos `catalog_products` + categorias hierárquicas + variantes + imagens, ao invés de `products`/`product_categories`. `catalog_featured` deixa de ser usada — destaque vira `is_featured` no próprio produto (a aba "Destaques" passa a ordenar/marcar `is_featured`).

Storage:
- Bucket público **`catalog-images`** com policy de SELECT público + INSERT/UPDATE/DELETE restrito ao dono via `auth.uid()::text = (storage.foldername(name))[1]`.
- Caminho: `{user_id}/{product_id}/{uuid}.jpg`.

## Frontend

### Sub-navegação
- `src/components/catalogo/CatalogoSubNav.tsx` — barra horizontal de tabs (`Catálogo | Banners | Destaques | Configurações`) que aparece dentro do `AppLayout` quando a rota começa com `/catalogo-admin`.
- Sidebar continua com um único item "Catálogo" apontando para `/catalogo-admin`.
- Rotas: `/catalogo-admin` (produtos), `/catalogo-admin/banners`, `/catalogo-admin/destaques`, `/catalogo-admin/configuracoes`.

### Aba 1 — Catálogo (produtos)  *(novo, conforme imagem)*
Componente `CatalogProductsManager.tsx`:
- Campo de busca largura total no topo.
- **Seção Categorias**: botão `+` para criar, chips com nome e ícone de edição. Click no chip filtra a lista. "Mais opções" expande para exibir subcategorias agrupadas por pai e permitir criar subcategoria dentro de uma categoria.
- **Seção Produtos**: botão azul "Adicionar produto" largura total. Lista de cards-linha com: thumb, nome + descrição curta, link "Contém variações" (se houver), estrela (toggle `is_featured`), lixeira (delete), switch `is_active`.

### Modal "Adicionar/editar produto" *(novo, conforme 2ª imagem)*
Componente `CatalogProductForm.tsx` (Dialog):
- Topbar: "Cancelar" (vermelho) | "Adicionar produto" | "Destacar" (azul, alterna `is_featured`).
- Campos: Nome, Preço (R$), Descrição (textarea com contador 0/10000), Categoria (dropdown com pais e filhas indentadas), Preço promocional.
- Accordions opcionais: **Estoque** (campo numérico), **Variações** (lista editável: nome + preço + estoque, botão "+ adicionar variação"), **Entrega** (prazo + observação).
- Rodapé fixo: botão de upload de imagens (até 5, preview com remover) à esquerda; botão "Adicionar" (ou "Salvar") à direita.

### Hooks
- `useCatalogProducts.ts` (list, create, update, delete, toggleActive, toggleFeatured)
- `useCatalogCategories.ts` (hierarquia, CRUD)
- `useCatalogVariants.ts` (CRUD por produto)
- Upload de imagens via Supabase Storage com compressão (`@/lib/imageCompress`).

## Out of scope (este plano)
- Não mexe em `/produtos` (calculador).
- Não migra produtos antigos automaticamente — vitrine passa a usar `catalog_products` zerada; usuário cadastra os do catálogo.
- Banners e Configurações não mudam de comportamento, só ganham nova navegação.

## Ordem de execução
1. Migração SQL (tabelas + bucket + RPC atualizada + remoção do uso de `catalog_featured`).
2. Hooks + storage helper.
3. `CatalogProductsManager` + `CatalogProductForm` + `CategoryChips`.
4. `CatalogoSubNav` + novas rotas em `App.tsx`.
5. Ajustar `CatalogoPublico.tsx` para consumir o novo shape da RPC.
