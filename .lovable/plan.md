
# Catálogo público com carrinho via WhatsApp

Uma vitrine pública dos produtos da gráfica, com URL única para compartilhar com clientes finais. O cliente navega, escolhe quantidade/tier e finaliza enviando o pedido pronto pelo WhatsApp do dono. Disponível em todos os planos.

## O que será entregue

### 1. Página pública `/catalogo/:slug`
- Sem login, igual ao layout do HTML enviado (navbar, banners em carrossel, filtros de categoria, busca, grid de cards).
- Cada card mostra: imagem/ícone, nome, especificações (tamanho, material, acabamento), prazo, "a partir de R$ X".
- Tag visual: **Promo** (vermelha) ou **Novo** (roxa) quando marcado.
- Botão "Quantidades" abre dropdown com os `price_tiers` do produto (qtd × preço, marca "Popular" no destaque).
- Selecionar tier + "Adicionar ao carrinho".
- Carrinho lateral/seção com itens, total e botão verde **Finalizar pelo WhatsApp** → abre `wa.me/{telefone}?text=...` com mensagem formatada (loja, itens, qtds, valores, total).
- Responsivo (mobile-first), tema próprio da página pública (não usa sidebar do app).

### 2. Página interna `/catalogo` (admin)
- Mesma visualização (preview do que o cliente vê) + botão **Copiar link público**.
- Tabs/seções para gerenciar:
  - **Banners**: criar/editar/remover slides (título, subtítulo, eyebrow, cor, CTA opcional, ordem, ativo).
  - **Destaques**: marcar produtos existentes como "Promo" / "Novo" e definir ordem de exibição no catálogo.
  - **Configurações**: ativar/desativar catálogo, slug personalizado, mensagem padrão do WhatsApp.

### 3. Reaproveitamento
- Produtos e categorias vêm de `products` / `product_categories` (já existem com `price_tiers`, `is_active`, `size`, `material`, `finish`, `production_time`).
- WhatsApp vem de `profiles.whatsapp`; nome da loja de `profiles.store_name`; logo de `profiles.logo_url`.

## Detalhes técnicos

### Banco de dados (1 migration)
```sql
-- Configuração do catálogo por usuário
catalog_settings (user_id PK, slug unique, is_active bool, whatsapp_message_template text,
                  primary_color text, created_at, updated_at)

-- Banners
catalog_banners (id, user_id, title, subtitle, eyebrow, bg_color, cta_label,
                 cta_url, sort_order, is_active, created_at, updated_at)

-- Destaques de produto (relação 1-1 com products, adiciona metadados de vitrine)
catalog_featured (id, user_id, product_id unique, badge ('promo'|'new'|null),
                  sort_order, is_active, created_at, updated_at)
```
RLS:
- `authenticated`: CRUD apenas das próprias linhas (`user_id = auth.uid()`).
- `anon`: `SELECT` permitido **apenas via RPCs SECURITY DEFINER** que recebem o `slug` e devolvem dados públicos (sem expor `user_id` direto). Segue o padrão de Client Portal / tracking já existente no projeto.

### RPCs públicas (SECURITY DEFINER)
- `get_public_catalog(slug)` → retorna `{ store_name, logo_url, primary_color, banners[], categories[], products[] (com price_tiers, badge, sort) }` filtrando apenas ativos.
- Nenhum endpoint expõe WhatsApp diretamente além do necessário para o link final (retorna no payload do catálogo).

### Frontend
- `src/pages/CatalogoPublico.tsx` (rota `/catalogo/:slug`) — sem `ProtectedRoute`, sem `AppLayout`.
- `src/pages/CatalogoAdmin.tsx` (rota `/catalogo`, dentro de `ProtectedRoute` + `AppLayout`).
- Componentes em `src/components/catalogo/`: `BannerCarousel`, `ProductCard`, `QuantityDropdown`, `CartDrawer`, `BannerManager`, `FeaturedManager`, `CatalogSettingsForm`.
- Hooks: `useCatalogSettings`, `useCatalogBanners`, `useCatalogFeatured`, `usePublicCatalog(slug)`.
- Carrinho em estado local (Zustand simples ou `useState` + Context) — não persiste em DB.
- Item de menu **Catálogo** no `AppSidebar` (ícone `Store` ou `LayoutGrid`).

### Mensagem WhatsApp
Formato padrão (editável em settings):
```
Olá {loja}! Quero fazer um pedido:

• Cartão de visita — 250 un — R$ 89,00
• Banner em lona — 2×1m — R$ 89,00

Total: R$ 178,00
```
Abre via `https://wa.me/{whatsapp}?text={encodeURIComponent(msg)}`.

### Tokens de design
- Reaproveitar `index.css` / `tailwind.config.ts`. As cores do HTML (`#534AB7`, `#1D9E75`, etc.) viram tokens semânticos (`--catalog-primary`, `--catalog-success`) ou usam variáveis já existentes, evitando classes hardcoded.

## Fora de escopo
- Não cria Quote/Order automaticamente (decidido: só WhatsApp).
- Sem pagamento online, sem upload de arte pelo cliente, sem login do cliente.
- Banners por enquanto sem upload de imagem (cor sólida + ícone, como o HTML). Upload pode ser fase 2.

## Ordem de implementação
1. Migration (3 tabelas + RLS + RPC pública + GRANTs).
2. Hooks + página admin (settings, banners, destaques).
3. Página pública + carrinho + integração WhatsApp.
4. Item no sidebar e rota pública no `App.tsx`.
