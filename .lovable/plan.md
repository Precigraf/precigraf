
## Objetivo
Remover as notificações/bloqueios de "recurso exclusivo Pro" dentro da Calculadora e do Marketplace, já que durante o teste de 2 dias todos os recursos ficam liberados. O `TrialBanner` (teste ativo/expirado) permanece — ele é o aviso oficial do sistema de trial.

## Mudanças

### 1. `src/components/CostCalculator.tsx`
- Remover o wrapper `<ProFeatureGate>` em volta de `<AdvancedOperationalCosts>` (linhas 614-626) — renderizar `AdvancedOperationalCosts` diretamente.
- Remover o banner "Sistema bloqueado — Você atingiu o limite de N cálculos" (linhas 459-483). O bloqueio por limite de cálculos durante o trial deixa de ser necessário enquanto features estão liberadas; o `TrialBanner` cobre o caso de expiração.
- Remover import de `ProFeatureGate` e do ícone `Lock` (se não usado em outro lugar do arquivo).
- Manter `UpgradePlanModal` apenas como destino de "Garantir acesso" do `TrialBanner`.

### 2. `src/components/MarketplaceSection.tsx`
- Remover totalmente o bloco `if (!isPro) { ... }` (linhas 185-213) que renderiza o overlay "Recurso exclusivo do Plano Pro". O componente passa a renderizar a versão completa para todos os usuários.
- Remover imports não utilizados após a limpeza (`Lock`, `Sparkles`, `Badge`, `Button` se não forem mais usados em outro ponto do arquivo — verificar antes de remover).

### 3. `src/pages/Marketplace.tsx`
- Remover `isPro`/`onShowUpgrade` passados para `<MarketplaceSection>` (props ficam opcionais, sem efeito).
- Manter `UpgradePlanModal` removido, ou mantê-lo desativado — proposta: remover o modal e o estado `showUpgradeModal` desta página, já que não há mais gatilho.

### 4. Não alterar
- `useUserPlan.tsx`: lógica de trial/featuresUnlocked permanece igual.
- `TrialBanner.tsx`: continua exibindo "teste ativo" e "teste expirado" — esta é a única notificação de plano que o usuário ainda verá nessas páginas.
- Páginas de Gestão/CRM (`Clientes`, `Orçamentos`, `Pedidos`, `Gestao`) não foram mencionadas e usam o mesmo `featuresUnlocked` via `ProtectedRoute`/banners próprios — fora do escopo desta tarefa.

## Resultado esperado
- Calculadora: sem cadeado em "Custos Operacionais", sem banner "Sistema bloqueado".
- Marketplace: simulação totalmente acessível, sem overlay de upgrade.
- O único aviso de plano que aparece nessas duas páginas é o `TrialBanner` (tempo restante do teste, ou aviso de expiração após os 2 dias).
