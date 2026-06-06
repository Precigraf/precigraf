# Plano: Catálogo profissional — banner, link, carrinho e modal

## 1. Banner / Imagem de Capa (Personalizar)
Substituir a antiga seção de "Banners" simples por **Imagem de Capa** com slide:
- Cartão expansível "Imagem de Capa — Banner principal do seu catálogo".
- Galeria com até **3 imagens** (mínimo 1) com pré-visualização, ordem, remover e reordenar.
- Validação: JPG/PNG/WebP, ≤ 2 MB, recomendado 1500×500 (3:1), compressão automática.
- Painel informativo (caixa cinza) replicando as regras (quantidade, tamanho, peso, formatos, alternância 3s).
- Upload via bucket `catalog-images` (já existe). Tabela `catalog_banners` reaproveitada — uma linha por imagem do slide (campos atuais já cobrem `image_url`, `sort_order`).
- No catálogo público: carrossel automático (3s) quando houver 2+ imagens; estático com 1.

## 2. Link público (renomear + simplificar)
- Renomear label "URL pública (slug)" → **"Seu Link (catálogo)"**.
- Exibir URL na forma **`precigraf.com.br/{slug}`** (sem subdomínio do Lovable, sem `/catalogo/`).
- Implementação: usar `PUBLIC_BASE_URL` (`src/lib/publicUrl.ts`, já configurado para `https://precigraf.com.br`) e adicionar rota raiz `/:slug` que renderiza `CatalogoPublico` quando o slug existe. Manter `/catalogo/:slug` como fallback/redirect.
- Botão Copiar e Abrir já existentes, ajustados para o novo formato.
- Nenhuma menção a domínio `lovable.app` na UI.

## 3. Remover seção "Design / Modelo"
- Remover accordion "Design" inteiro da página Personalizar.
- Manter coluna `template` no banco (sem uso visível) para não quebrar RPC.

## 4. WhatsApp da loja (sincronizado com perfil)
- O número usado para finalizar pedido é o `whatsapp` de `profiles` (já retornado em `get_public_catalog.store.whatsapp`).
- Na aba "Mensagem do WhatsApp": exibir aviso "Número usado: {whatsapp do perfil}" + link "Editar em Configurações da empresa" (`/perfil`).
- Editor do template de mensagem permanece. Novas variáveis: `{loja}`, `{itens}`, `{total}`, `{cliente}` (opcional).

## 5. Nome + logo da empresa sincronizados
- O catálogo público já lê `store.name` e `store.logo_url` da `profiles` (via RPC). Garantir uso consistente no header do catálogo público (substituir qualquer texto fixo).

## 6. Carrinho + Modal de Produto (catálogo público)
Nova experiência inspirada na referência (Offstore), com funcionalidades equivalentes:

**Modal do produto** (`ProductDetailModal.tsx`):
- Galeria de imagens à esquerda (thumbnails verticais + imagem principal).
- À direita: nome, preço (com preço promocional riscado se houver), seletor de **variações** (chips/pills com nome e estoque), seletor de quantidade (− 1 +), botão **Adicionar ao carrinho**.
- Abaixo: bloco **Descrição** com o texto completo do produto.
- Botão "Comprar agora" (atalho: adiciona e abre carrinho).

**Carrinho** (`CartDrawer.tsx` + `useCart` hook com `localStorage`):
- Ícone flutuante/header com badge de quantidade.
- Drawer lateral lista: imagem, nome, variação, qtd (±), subtotal, remover.
- Total geral; botão **Finalizar pelo WhatsApp**.
- Mensagem gerada a partir de `whatsapp_message_template` substituindo:
  - `{loja}` → store.name
  - `{itens}` → lista formatada `- 2x Produto X (Variação) — R$ 80,00`
  - `{total}` → R$ total
- Abre `https://wa.me/{whatsapp}?text={encoded}` (mesma lógica usada no orçamento — referenciar `OrcamentoEditor`/`AprovacaoOrcamento` para consistência).

**Card do produto** no grid:
- Clique em qualquer lugar do card abre o modal (não envia direto pro WhatsApp).
- Botão "Comprar" do card também abre o modal.

## 7. Migração SQL
- Nenhuma estrutura nova obrigatória; `catalog_banners` e `catalog_settings` já comportam o necessário.
- Atualizar RPC `get_public_catalog` apenas se faltar algum campo (verificar `description`, `promotional_price`, `variants` no payload — já presentes).

## Out of scope
- Subdomínio `nomedaloja.precigraf.com.br` (requer wildcard DNS/SSL — decidido usar `precigraf.com.br/{slug}`).
- Pagamento online no catálogo (segue via WhatsApp).
- Favoritos / compartilhar produto (botões só visuais por enquanto).

## Arquivos afetados
- **Editar**: `src/pages/CatalogoPersonalizar.tsx` (remover Design, renomear link, exibir URL precigraf.com.br, aviso WhatsApp), `src/pages/CatalogoPublico.tsx` (carrossel banner, header dinâmico, abrir modal no card, integrar carrinho), `src/App.tsx` (rota `/:slug` opcional), `src/hooks/useCatalog.ts` (mutações de banner com upload), `src/lib/publicUrl.ts` (helper `buildCatalogUrl`).
- **Criar**: `src/components/catalogo/CoverBannerManager.tsx`, `src/components/catalogo/public/ProductDetailModal.tsx`, `src/components/catalogo/public/CartDrawer.tsx`, `src/hooks/useCart.ts`.
