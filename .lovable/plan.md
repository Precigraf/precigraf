# Otimização Mobile Completa

## Objetivo
Deixar 100% das telas do sistema responsivas no mobile (< 768px), eliminando textos cortados, elementos sobrepostos, scrolls horizontais indevidos, botões fora de área, modais quebrados e desalinhamentos. Sem quebrar o layout desktop.

## Diagnóstico (problemas recorrentes detectados)

1. **Headers de página** (`Pedidos`, `Orçamentos`, `Clientes`, `Produtos`, `Financeiro`, `Marketplace`, `Perfil`, `Gestão`) — título + botões na mesma linha sem stack mobile, botões "Novo X" frequentemente saem da tela em telas estreitas.
2. **Cards de KPI** (`Pedidos.tsx` linha 93) — `grid-cols-2 md:grid-cols-4` ok, mas conteúdo interno com `flex items-center gap-3` quebra com números longos.
3. **Kanban** (`KanbanBoard.tsx`) — colunas fixas `w-64` com scroll horizontal funcional, mas no mobile o usuário não percebe que pode rolar; falta indicador / snap.
4. **Tabelas / linhas de pedido** (`Pedidos.tsx` linha 140) — `flex-wrap md:flex-nowrap` força quebra ruim; ações ficam soltas; valores grandes truncados.
5. **OrcamentoEditor (872 linhas)** — formulário denso, inputs lado a lado, totais sticky podem cobrir conteúdo no mobile.
6. **Modais** (`OrderDetailsModal`, `ProductForm`, `QuoteForm`, `ClientForm`, `ConvertToOrderModal`, `OrderPaymentModal`) — usam `DialogContent` padrão que no mobile estoura altura, falta scroll interno e padding adequado.
7. **AppSidebar / AppLayout** — header tem só `SidebarTrigger`, sem título contextual no mobile; sidebar collapse ok mas conteúdo principal fica com `px-4` apertado.
8. **RastreioPedido** — stepper horizontal de 7 status no mobile gera overflow / textos sobrepostos.
9. **Auth / Cadastro / Upgrade / PagamentoConfirmado** — cards centralizados precisam de `px` seguro e botões `w-full` no mobile.
10. **Produtos** — listagem de `price_tiers` em uma linha (`line-clamp-1`) corta variações; no mobile precisa stack.
11. **Calculadora (Index)** — `ResultPanel` é `sticky top-6`, no mobile deveria ficar abaixo, não sticky.
12. **CalculationHistory, MarketplaceImpact, QuantitySimulator, CostChart** — gráficos e tabelas internas precisam `overflow-x-auto` e fontes menores no mobile.

## Estratégia (padrões aplicados a TUDO)

- **Container base:** `px-3 sm:px-4 lg:px-6 py-4 sm:py-6` (substituir `px-4 py-6`).
- **Headers de página:** `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`. Botões de ação: `w-full sm:w-auto` quando primários únicos, agrupados em `flex flex-wrap gap-2`.
- **Botões com ícone + texto:** texto via `<span className="hidden sm:inline">`, mantendo só o ícone no mobile quando houver +2 botões na mesma linha.
- **Grids de KPI:** `grid-cols-2 lg:grid-cols-4`, conteúdo interno `min-w-0` + `truncate` em valores; ícones `shrink-0`.
- **Linhas de lista (Pedidos/Orçamentos/Clientes):** virar **card stack** no mobile (`flex-col sm:flex-row`), com bloco de ações no rodapé do card.
- **Modais:** `DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6"`; formulários internos passam de `grid-cols-2` para `grid-cols-1 sm:grid-cols-2`.
- **Tipografia:** `text-2xl` → `text-xl sm:text-2xl`; `text-4xl` → `text-3xl sm:text-4xl`.
- **Tabelas:** wrapper `overflow-x-auto -mx-3 sm:mx-0` com `min-w-[600px]` na table.
- **Sticky:** desativar `sticky` em < lg quando ocupa coluna lateral (`lg:sticky lg:top-6`).
- **Header global (`AppLayout`):** mostrar título da rota atual ao lado do `SidebarTrigger` no mobile.
- **Kanban:** adicionar `snap-x snap-mandatory` no container e `snap-center` nas colunas; reduzir largura para `w-[80vw] max-w-[260px] sm:w-64` no mobile; hint visual "← deslize →".
- **RastreioPedido stepper:** virar **vertical** em < sm (`flex-col sm:flex-row`), com linha conectora vertical.
- **Inputs:** garantir `text-base` em mobile (evita zoom iOS) — adicionar utilitário no `index.css` para `input, textarea, select { font-size: 16px; } @media (min-width: 640px) { font-size: 14px; }`.
- **ResultPanel (calculadora):** remover `sticky top-6` no mobile (`lg:sticky lg:top-6`).

## Arquivos a editar

**Layout / globais**
- `src/index.css` — fix de zoom em input mobile + utilitários `safe-x` padding.
- `src/components/AppLayout.tsx` — header com título contextual no mobile.
- `src/components/AppSidebar.tsx` — verificar item ativo / `useIsMobile`.

**Páginas (todas com header + container ajustados)**
- `src/pages/Pedidos.tsx` — header, KPIs, lista vira card mobile, ações reorganizadas.
- `src/pages/Orcamentos.tsx` — header + lista responsiva.
- `src/pages/Clientes.tsx` — header + lista responsiva.
- `src/pages/Produtos.tsx` — header (3 botões viram menu/stack), tiers em stack mobile.
- `src/pages/Financeiro.tsx` — KPIs e gráficos com overflow seguro.
- `src/pages/Marketplace.tsx` — formulário e resultado responsivos.
- `src/pages/Perfil.tsx` — abas/forms em coluna no mobile.
- `src/pages/Gestao.tsx` — Kanban com snap + hint.
- `src/pages/Producao.tsx` — header + listagem.
- `src/pages/OrcamentoEditor.tsx` — inputs em coluna, totais não-sticky no mobile, ações no rodapé.
- `src/pages/RastreioPedido.tsx` — stepper vertical no mobile.
- `src/pages/Auth.tsx` / `Cadastro.tsx` / `Upgrade.tsx` / `PagamentoConfirmado.tsx` / `NotFound.tsx` — padding seguro, botões `w-full`.
- `src/pages/Index.tsx` (Calculadora) — ResultPanel não-sticky no mobile.

**Componentes**
- `src/components/gestao/KanbanBoard.tsx` + `KanbanColumn.tsx` — snap + largura responsiva.
- `src/components/gestao/OrderCard.tsx` — densidade mobile.
- `src/components/gestao/OrderDetailsModal.tsx` — modal scrollável + grids 1 col.
- `src/components/gestao/ProductForm.tsx` — variações em stack mobile.
- `src/components/gestao/QuoteForm.tsx` / `ClientForm.tsx` / `ConvertToOrderModal.tsx` / `OrderPaymentModal.tsx` / `CategoryManager.tsx` — modal responsivo padrão.
- `src/components/ResultPanel.tsx` — remover sticky no mobile, ajustes de tipografia.
- `src/components/CalculationHistory.tsx` — wrapper overflow.
- `src/components/QuantitySimulator.tsx` / `CostChart.tsx` / `MarketplaceImpact.tsx` / `PriceBreakdown.tsx` — overflow-x-auto / fontes menores.
- `src/components/Header.tsx` — verificar área pública.
- `src/components/TrialBanner.tsx` / `PlanBadge.tsx` — não cortar texto.

## QA mobile (após implementação)

Para cada rota principal: `/`, `/auth`, `/cadastro`, `/produtos`, `/clientes`, `/orcamentos`, `/orcamentos/novo`, `/pedidos`, `/gestao`, `/financeiro`, `/marketplace`, `/perfil`, `/producao`, `/upgrade`, `/pedido/<token>`:
- Capturar screenshot em **375x812** (iPhone padrão) e **414x896**.
- Verificar: sem scroll horizontal indevido, sem texto cortado, botões clicáveis, modais abrem e fecham corretamente, formulários submetem.
- Repetir em 768x1024 (tablet) e 1280x720 (desktop) para garantir que nada quebrou.

## Resultado esperado

Todas as páginas e modais usáveis e visualmente alinhadas em qualquer dispositivo a partir de 320px de largura, sem regressões no desktop.
