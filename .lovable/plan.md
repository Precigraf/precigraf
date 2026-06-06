# Catálogo: busca, imagens, modal por variação e aviso de WhatsApp

## 1. Imagens do produto não aparecem (causa raiz)

O bucket `catalog-images` está **privado** (`public=false`). O código usa `getPublicUrl()`, que devolve uma URL pública — mas como o bucket é privado, ela retorna 400/403 e a imagem não renderiza nem no admin (pré-visualização) nem no catálogo público.

**Correção:**
- Tornar o bucket `catalog-images` público via `supabase--storage_update_bucket(public=true)`.
- Manter políticas RLS de escrita restritas a `auth.uid()` (leitura passa a ser pública, que é o desejado para imagens de catálogo).
- Não é preciso re-upload das imagens já salvas — as URLs existentes voltam a funcionar.

> Se a workspace bloquear buckets públicos, manter privado e trocar para URLs assinadas (`createSignedUrl`) com TTL longo no `useCatalogProducts` e no RPC `get_public_catalog`. Plano A (público) é o caminho preferido.

## 2. Busca e filtros no catálogo público

Hoje `CatalogoPublico.tsx` já tem `search` e `filterCat`, mas só filtra por **nome** e mostra apenas categorias **pai**. Melhorar:
- Busca também por `description` e por nome da **variação**.
- Mostrar **subcategorias** quando a categoria pai estiver selecionada (chips de segundo nível).
- Botão "Limpar filtros" quando houver busca/categoria ativa.
- Estado vazio com sugestão ("Tente outro termo ou veja todos os produtos").
- Em mobile, faixa de chips com scroll horizontal e busca acima dos chips.

## 3. Modal de produto: preço por variação + add direto

`ProductDetailModal.tsx` já tem seletor de variação e botão "Adicionar ao carrinho". Ajustes:
- Mostrar **lista de variações como cards** com nome, preço próprio e estoque (não só pill).
- Quando o produto **tem variações**, exigir seleção antes de habilitar "Adicionar" (hoje pré-seleciona a primeira — manter pré-seleção mas destacar o preço da selecionada).
- Exibir **preço "a partir de R$ X"** no card do produto quando houver variações com preços diferentes (já existe `minPrice` no `ProductCard`, garantir uso consistente).
- Botão "Adicionar ao carrinho" fica **sticky** no rodapé do modal em mobile.
- Remover o segundo botão "Comprar agora" (redundante — abre o mesmo carrinho). Manter só "Adicionar ao carrinho" + atalho "Ver carrinho" depois de adicionar (toast com ação).

## 4. Aviso do WhatsApp em Personalizar

Na aba "Mensagem do WhatsApp" do `CatalogoPersonalizar.tsx`, exibir um banner informativo:

> 📱 O número usado para receber os pedidos é o **telefone informado em Configurações da empresa**. [Editar telefone →] (link para `/perfil`)

Mostrar o número atual lido de `profiles.whatsapp` (via `useCompanyProfile`). Se estiver vazio, banner em tom de aviso (amarelo) com CTA para preencher.

## Arquivos afetados

**Editar:**
- `src/pages/CatalogoPublico.tsx` — busca expandida, subcategorias, chips melhorados, empty state.
- `src/components/catalogo/public/ProductDetailModal.tsx` — variações como cards com preço, sticky CTA, remover "Comprar agora".
- `src/pages/CatalogoPersonalizar.tsx` — banner informativo do WhatsApp na aba de mensagem.

**Backend:**
- Tornar bucket `catalog-images` público (chamada de tool, não migration).

## Fora de escopo
- Reorganização do CRUD de categorias/subcategorias (já existe `CategoryManager`).
- Mudança no RPC `get_public_catalog` (já devolve tudo necessário).
- Upload de imagens (lógica está correta — o problema é só permissão do bucket).
