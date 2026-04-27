# Bloqueio do sistema após expiração do trial (2 dias)

## Objetivo
Quando o período de teste de 2 dias expirar e o usuário ainda estiver no plano `free`, **todas as funcionalidades** do sistema devem ser bloqueadas, exibindo uma tela única chamando o usuário para fazer upgrade ao Plano Pro.

Hoje o bloqueio é **parcial e por componente** (CostCalculator, SaveCalculationButton, Gestao). Páginas como Clientes, Orçamentos, Pedidos, Produção, Produtos, Financeiro, Marketplace permanecem totalmente acessíveis mesmo após o trial expirar.

## Solução: Guard global no `ProtectedRoute`

### 1. `src/components/TrialExpiredScreen.tsx` (novo)
Tela full-screen exibida quando o trial expira:
- Ícone de cadeado + título "Seu período de teste terminou"
- Mensagem explicando que o acesso foi bloqueado
- Resumo dos benefícios do Plano Pro
- Botão **"Fazer upgrade agora"** → navega para `/upgrade`
- Botão secundário **"Sair"** → executa `signOut()` do `AuthContext`
- Sem sidebar, sem header — tela isolada para evitar interação com qualquer outra parte

### 2. `src/components/ProtectedRoute.tsx` (modificar)
Após verificar autenticação, usar `useUserPlan()`:
- Se `loading` do plano → spinner
- Se `isTrialExpired === true` (ou seja, `plan === 'free'` E `trial_ends_at <= now`):
  - **Exceção**: permitir acesso a `/upgrade`, `/perfil` e `/pagamento-confirmado` para que o usuário consiga concluir o pagamento e ver/editar dados básicos
  - Para qualquer outra rota → renderizar `<TrialExpiredScreen />` em vez de `children`
- Caso contrário → renderizar `children` normalmente

Detectar a rota atual via `useLocation()` do `react-router-dom`.

### 3. Limpeza dos bloqueios redundantes (opcional, mas recomendado)
Como o guard global já cobre tudo, simplificar:
- `CostCalculator.tsx`: o overlay/`isBlocked` interno deixa de ser necessário (mas pode ser mantido como camada extra de defesa — sem custo).
- `TrialBanner` para `isTrialExpired` deixa de aparecer dentro das páginas (já não serão alcançadas). O banner de **trial ativo** continua aparecendo normalmente durante os 2 dias.

Sugestão: manter as proteções existentes como defesa em profundidade e apenas adicionar o guard global — sem remover nada.

## Segurança no backend
A função `check_calculation_limit` no Postgres já rejeita inserts de cálculos quando o trial expira (`RAISE EXCEPTION 'Seu período de teste terminou...'`). RLS e demais validações server-side permanecem intactas. Esta mudança é apenas de UX no client — o backend já é seguro.

## Arquivos
- **Criar**: `src/components/TrialExpiredScreen.tsx`
- **Editar**: `src/components/ProtectedRoute.tsx`

## Resultado
- Usuário em trial ativo (≤ 2 dias): acesso completo, com `TrialBanner` mostrando tempo restante.
- Usuário com trial expirado e plano free: vê apenas a tela de upgrade (com acesso a `/upgrade`, `/perfil`, `/pagamento-confirmado`). Todas as demais rotas redirecionam para a tela de bloqueio.
- Usuário Pro (lifetime ou pro_monthly ativo): acesso completo, sem qualquer banner.
