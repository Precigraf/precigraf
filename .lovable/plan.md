

# Plano de Implementação

Vou organizar as mudanças em 5 áreas distintas. Antes, preciso esclarecer um ponto crítico sobre orçamentos.

## 1. Dashboard — Painel "Meu Plano"

**Arquivo:** `src/pages/Gestao.tsx`

Novo card destacado abaixo do cabeçalho, antes das métricas:
- Título "Meu Plano" + nome do plano (Teste Grátis / Pro)
- Badge de status ("Período de Teste", "Plano Ativo", "Expirado")
- Botão "Fazer Upgrade" no canto superior direito (oculto se já for Pro) → navega para `/upgrade`
- Bloco com ícone calendário, "Teste expira em [data por extenso]" e "X dia(s) restantes"
- Usa `useUserPlan()` (`trialEndsAt`, `trialRemainingHours`, `plan`, `isTrialActive`, `isTrialExpired`)
- Data formatada com `date-fns` em pt-BR (ex: "19 de abril de 2026")
- Dias restantes = `Math.ceil(trialRemainingHours / 24)`

Remove o badge atual de plano no cabeçalho (substituído por este painel).

## 2. Marketplace

**Arquivo:** `src/pages/Marketplace.tsx`
- Remover input de **Quantidade**
- Manter apenas **Preço base total do produto**
- Recalcular `unitFinalPrice` e `totalFees` sem multiplicar por quantidade

## 3. Clientes

**Arquivo:** `src/pages/Clientes.tsx` (e card relacionado)
- Adicionar botão **Visualizar** (ícone `Eye`) que abre Dialog com todos os campos cadastrados (nome, doc, contato, endereço, observações)
- Coluna/campo WhatsApp: substituir texto puro por botão verde com ícone do WhatsApp (`MessageCircle` do lucide com cor `#25D366`) que abre `https://wa.me/{numero}` em nova aba

## 4. Configurações

**Arquivo:** `src/pages/Perfil.tsx`
- Seção **Meu Perfil**: remover bloco de avatar/foto de usuário
- Seção **Empresa**: remover campos **Cor do sistema** e **Nome da loja (sidebar)**
- Manter logo, dados da empresa, endereço, PIX, etc.

**Arquivo:** `src/components/AppSidebar.tsx`
- Como `store_name` deixa de ser editável, usar fallback fixo "Precigraf" (ou `company_name` se existir) no lugar
- Manter exibição do logo

**Arquivo:** `src/components/AppLayout.tsx`
- Remover/desativar `useSystemColor` (cor dinâmica não será mais configurável)

## 5. Tela de Orçamento — Reformulação completa

Esta é a maior mudança. Plano resumido:

**Novo arquivo:** `src/pages/OrcamentoEditor.tsx` (rota `/orcamentos/novo` e `/orcamentos/:id`)

Layout 2 colunas (lg:grid-cols-3, esquerda span-2):

**Painel Esquerdo:**
- Cabeçalho: código `ORC-{n}` sequencial, badge status, data criação
- Ações topo: "Converter para Pedido" | "Exportar PDF" | "Salvar"
- **Cliente:** Combobox de busca (nome/documento) + botão limpar + botão "Novo Cliente" (abre `ClientForm`)
- **Itens:** lista com nome/qtd × unit/total + botão remover + "+ Adicionar Item" (modal busca em `calculations` salvos como catálogo de produtos)
- **Observações:** Textarea + DatePicker validade + Select status (Rascunho/Enviado/Aprovado/Recusado)

**Painel Direito (sticky):**
- Subtotal (soma itens) + qtd itens
- Desconto: input + toggle %/R$ (valor calculado em vermelho com sinal −)
- Frete: input opcional (verde com +)
- Total = Subtotal − Desconto + Frete (formato `R$ x.xxx,xx`)

**Listagem `Orcamentos.tsx`:** mantém com botão "Novo Orçamento" → navega para `/orcamentos/novo`

### Mudanças de banco necessárias

Novas colunas em `quotes`:
- `quote_number` int sequencial (com sequence por user via trigger)
- `items` jsonb (array de itens)
- `discount_value` numeric, `discount_type` text ('percent'|'fixed')
- `shipping_value` numeric
- `subtotal` numeric
- `notes` text
- `valid_until` date

Novo trigger para gerar `quote_number` sequencial por `user_id`.

## Pergunta crítica antes de implementar

<questions--ask_questions>
</questions--ask_questions>

### Catálogo de itens do orçamento

O sistema atual não tem uma tabela `products` (catálogo). Os "produtos" hoje vêm de `calculations` (cálculos salvos pela calculadora). Para o botão **"+ Adicionar Item"** do novo editor de orçamento, qual fonte usar?

**Opção A — Usar cálculos salvos como catálogo (recomendado, sem migração extra):** modal lista `calculations` do usuário; ao selecionar, importa nome, preço unitário e quantidade padrão; usuário pode ajustar qtd/valor inline.

**Opção B — Criar tabela `products` nova:** catálogo independente com CRUD próprio (nome, preço, descrição). Adiciona uma página "Produtos" e migrações.

**Opção C — Item livre (manual):** modal apenas com campos vazios (nome, qtd, valor unit), sem catálogo.

Vou aguardar sua escolha entre A / B / C antes de iniciar a implementação do editor de orçamento. As outras 4 áreas (Dashboard, Marketplace, Clientes, Configurações) seguem o plano acima sem ambiguidade.

