# Construtor de Catálogo de Preços

Nova área do Precigraf onde o usuário monta um catálogo/tabela de preços profissional em um editor guiado: o sistema controla o design, o usuário controla o conteúdo. Preview em tempo real, salvamento automático e download em PNG, JPEG ou PDF.

Decisões confirmadas: item de menu separado "Catálogos de Preços", visível apenas para seu e-mail (mesma feature flag em construção), tabela de preços apenas manual nesta versão (arquitetura pronta para importar precificações depois).

## Telas

**Meus Catálogos** (`/catalogos`)
- Grade de cards com miniatura, nome, produto e data da última edição.
- Ações por card: Editar, Duplicar, Baixar, e menu com Excluir (modal de confirmação padrão do sistema).
- Botão principal "+ Criar catálogo".
- Estado vazio elegante: "Crie seu primeiro catálogo de preços" + botão.

**Editor** (`/catalogos/:id`)
- Barra superior: voltar, nome do catálogo (editável), status "Salvando…" / "Alterações salvas" / erro com "Tentar novamente", botão "Baixar catálogo".
- Desktop: configurações à esquerda (~38%, rolagem própria) e preview fixo à direita (~62%).
- Mobile/tablet: abas "Editar" e "Visualizar".
- Configurações em accordions: Marca, Produto, Tabela de preços, Ideal para, Informações do produto, Aparência.

### Conteúdo das seções
- **Marca**: upload de logo (PNG/JPG/JPEG/WebP, com recomendação de qualidade, substituir/remover), nome, slogan, switches "Mostrar logo" e "Mostrar slogan".
- **Produto**: título principal, palavra de destaque (usa cor principal/secundária) e complemento; foto do produto com zoom, reposicionamento e recorte dentro de área fixa — zoom/posição/crop são salvos; aviso quando a resolução for baixa.
- **Tabela de preços**: título editável (padrão "Tabela de valores"), linhas quantidade + preço (máx. 6), adicionar/remover/reordenar, tipo do valor (por unidade / total) e switch para exibir "/un.". Moeda no padrão brasileiro (R$ 3,50), com o mesmo tratamento monetário já usado no sistema. Campo "Origem dos valores" preparado, com "Inserir manualmente" ativo nesta versão.
- **Ideal para**: título editável, até 4 itens com ícone (biblioteca curada de Lucide: joias, diamante, relógio, roupas, cosméticos, perfume, presentes, acessórios, alimentos, doces, papelaria, artesanato, sacola, caixa, outros), rótulo, excluir e reordenar.
- **Informações do produto**: até 4 características com ícone, título e valor; adicionar, editar, excluir, reordenar; distribuídas em colunas iguais no rodapé.
- **Aparência**: cores principal, secundária, texto e fundo (picker + HEX); moldura da foto (principal / secundária / sem moldura); cantos (retos / arredondados); tipografia em presets (Moderna, Elegante, Minimalista, Comercial, Clássica) usando as fontes já disponíveis no projeto.

Todos os campos de texto têm limite de caracteres com contador (ex.: 21/30), limites diferentes por elemento e redução controlada de fonte para nunca quebrar o layout.

## Template Clássico

Área lógica fixa em proporção 4:3 (1448 × 1086). O preview apenas escala proporcionalmente — a composição nunca muda com o tamanho da tela.

```text
+---------------------------------------------------+
| logo / marca / slogan        TÍTULO  DESTAQUE  ... |
+---------------------------------------------------+
|                        |  Tabela de valores        |
|   Foto do produto      |  20 un ......... R$ 3,50  |
|   (área fixa)          |  50 un ......... R$ 3,10  |
|                        |---------------------------|
|                        |  Ideal para  [ic] [ic]    |
+---------------------------------------------------+
|  Medida  |  Papel  |  Alça  |  Acabamento          |
+---------------------------------------------------+
```

O mesmo componente de template é usado no preview e na exportação, garantindo fidelidade.

## Estado inicial e validações

Novo catálogo já nasce com conteúdo demonstrativo editável (Sua Marca / SACOLA MINI PERSONALIZADA / 3 faixas de preço / 3 indicações / 4 informações), sinalizado no editor como exemplo. Antes de exportar valida nome do produto, ao menos uma linha de preço válida, quantidades e preços — com mensagens junto aos campos. Slogan e "Ideal para" continuam opcionais.

## Exportação

Modal "Exportar catálogo": formato (PNG / JPEG / PDF), nome do arquivo sanitizado (padrão `catalogo-nome-do-produto`), qualidade alta, botões Cancelar / Baixar. Renderização do template em escala maior (2x preparado), aguardando fontes e imagens carregarem; PDF sem cabeçalhos, URL ou margens do navegador.

## Detalhes técnicos

- **Rotas**: `/catalogos` e `/catalogos/:id`, dentro de `ProtectedRoute` + gate de feature flag (reuso de `canAccessCatalog`, renomeado/estendido para cobrir a nova área). Novo item no `AppSidebar` com o mesmo filtro.
- **Banco**: tabela `price_catalogs` (`id`, `user_id`, `name`, `template_id`, `product_id` opcional, `configuration jsonb`, `thumbnail_url`, `created_at`, `updated_at`) com GRANTs, RLS por `auth.uid()` e trigger de `updated_at`.
- **Storage**: bucket `catalog-builder` com arquivos organizados por `user_id`, políticas de leitura/escrita por dono, limite de tamanho e validação de MIME; substituição de imagem remove o arquivo anterior.
- **Tipos**: `CatalogConfig` tipado (brand, product, pricing, idealFor, specifications, appearance, templateId) com valores padrão versionados — sem `any`.
- **Componentes**: `CatalogEditor`, `CatalogPreview`, `CatalogTemplateRenderer` (registry de templates), `templates/ClassicCatalog`, `CatalogExportModal`, mais os painéis de seção; hooks `usePriceCatalogs` (lista/CRUD via React Query) e `useCatalogAutosave` (debounce ~800ms, sem condição de corrida, estado salvando/salvo/erro).
- **Reordenação**: `@dnd-kit` já presente no projeto, restrito às listas.
- **Exportação**: adicionar `html-to-image` para PNG/JPEG e reutilizar o `jspdf` já instalado para embutir a imagem em página única na proporção do template.
- **Acessibilidade**: labels, aria-label, foco em modais, estados disabled/loading.

Nada fora dessa área é alterado, exceto o novo item de menu e as novas rotas.
