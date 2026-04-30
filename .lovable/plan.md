# Landing Page de Alta Conversão — PreciGraf

## Objetivo
Criar uma landing page pública profissional, focada em conversão, que apresenta o PreciGraf como a solução definitiva de precificação para gráficas, conduzindo o visitante ao cadastro (trial grátis) ou upgrade Pro.

## Identidade visual (mantida)
- Paleta monocromática preto/branco (tokens HSL existentes: `--foreground`, `--background`, `--card`, `--muted`).
- Tipografia: Inter (já carregada).
- Componentes: shadcn/ui (`Button`, `Card`, `Badge`, `Accordion`).
- Logo: `<LogoIcon />` em quadrado preto arredondado.
- Tema dark/light suportado via `useTheme`.
- Cantos arredondados (`--radius: 0.75rem`), sombras suaves.

## Rota e navegação
- Nova rota pública `/lp` em `App.tsx` (sem `ProtectedRoute`).
- Botão "Acessar" no header da LP → `/auth`. Botão "Começar grátis" → `/cadastro`.
- Não altera a rota `/` (continua sendo a calculadora para usuários logados).
- Usuários autenticados que acessarem `/lp` veem CTA "Ir para o app".

## Estrutura da página

```text
1. NAV (logo + Entrar + CTA Começar grátis)
2. HERO (H1 + subtítulo + 2 CTAs + mockup da calculadora)
3. PROVA SOCIAL
4. PROBLEMA (dor do cliente)
5. SOLUÇÃO (3-4 pilares com ícones)
6. FEATURES detalhadas (grid 2x3)
7. COMO FUNCIONA (3 passos)
8. DEPOIMENTOS (3 cards)
9. PRICING (Trial Grátis vs Pro R$15,90/mês)
10. FAQ (Accordion 6 perguntas)
11. CTA FINAL (faixa preta full width)
12. FOOTER
```

### Copy principal (PT-BR)

**Hero**
- H1: "Precifique seus serviços gráficos com a precisão que seu lucro merece"
- Sub: "A calculadora completa para gráficas calcularem custos, margens e preços finais — sem planilhas confusas e sem prejuízo."
- CTA primário: "Começar período grátis"
- CTA secundário: "Ver como funciona"
- Microcopy: "Sem cartão de crédito • Acesso imediato"

**Pilares**
1. Cálculo de custo real (matéria-prima, tinta, mão de obra)
2. Margem e preço final automáticos
3. Simulação por quantidade (Pro)
4. Gestão de clientes, orçamentos e pedidos

**Features**
- Calculadora completa de custos
- Custos operacionais avançados (depreciação, energia, mão de obra)
- Marketplace builder (taxas, cupons, frete)
- CRM com Kanban de pedidos
- Área pública de rastreio
- Histórico ilimitado e exportação

### Pricing (atualizado)

Dois cards lado a lado:

**Card 1 — Trial / Período Grátis**
- Título: "Período Grátis"
- Preço: "R$ 0"
- Subtexto: "Teste sem compromisso"
- Lista: Acesso à calculadora • Cálculos básicos de custo e margem • Sem cartão de crédito
- CTA: "Começar grátis" (outline) → `/cadastro`

**Card 2 — Pro (DESTAQUE)**
- Borda forte (`border-2 border-foreground`), sombra reforçada, leve `scale-105` no desktop.
- Badge no topo: "Mais popular" (`bg-foreground text-background`).
- Título: "Pro"
- Preço: "R$ 15,90" + sufixo "/mês" em muted
- Subtexto: "Tudo que sua gráfica precisa"
- Lista de benefícios:
  - Cálculos ilimitados
  - Simulador por quantidade
  - Custos operacionais avançados
  - CRM completo (Clientes, Orçamentos, Pedidos)
  - Kanban de produção e área pública de rastreio
  - Marketplace builder com cupons e frete
  - Exportação PDF e Excel
  - Histórico ilimitado
  - Suporte prioritário
  - Todas as atualizações futuras
- CTA: "Assinar Pro" (preenchido, preto) → `/cadastro?plan=pro`

**FAQ** (6 perguntas curtas: o que é, como funciona o trial, como funciona a assinatura mensal, posso usar no celular, é seguro, como cancelo)

**CTA Final**
- Faixa full width preta: "Pronto para precificar com confiança?" + botão branco grande "Criar conta grátis"

## Princípios de UX/conversão
- Hierarquia visual: H1 grande (`text-5xl md:text-7xl`), espaçamento generoso (`py-20 sm:py-28`).
- CTA primário visível em 3+ pontos (hero, pricing, faixa final).
- Prova social acima da dobra.
- Microcopy de redução de fricção: "sem cartão", "cancele quando quiser".
- Mobile-first: stack vertical em `<sm`, CTAs full-width.
- Acessibilidade: alt em imagens, contraste AAA, foco visível.
- Performance: zero imagens externas, ilustrações via Lucide + composições CSS.

## Arquivos a criar/editar

**Criar**
- `src/pages/LandingPage.tsx` — página com seções como subcomponentes internos.
- `src/components/landing/LandingNav.tsx` — header sticky.
- `src/components/landing/HeroMockup.tsx` — mockup CSS da calculadora.

**Editar**
- `src/App.tsx` — adicionar `<Route path="/lp" element={<LandingPage />} />` (rota pública).
- `index.html` — atualizar `<title>` e `<meta description>` orientados à conversão.

## Detalhes técnicos
- Sem novas dependências (shadcn/ui + lucide-react já instalados).
- Sem chamadas a backend; página estática 100%.
- `useAuth()` para alternar CTA do header ("Entrar" ↔ "Ir para o app").
- Tokens semânticos (`bg-background`, `text-foreground`) — nada hardcoded.
- Animações leves via Tailwind (`transition-colors`, `hover:scale-[1.02]`, `animate-in fade-in`).
- SEO básico no `index.html` (title, meta description, og tags).

## Observação sobre cobrança
A landing apresenta o Pro como **R$ 15,90/mês**. O fluxo de checkout atual (InfinitePay vitalício R$ 29,90 registrado em memória) **não será alterado neste plano** — apenas a comunicação visual da LP. Caso queira que o checkout real passe a cobrar mensal R$ 15,90, posso planejar essa mudança em uma próxima etapa (envolve alterar produto/plano no provedor de pagamento e ajustar a lógica de ativação do `plan_id`).

## Resultado esperado
Landing page acessível em `/lp`, totalmente responsiva, fiel à identidade preto/branco minimalista, com fluxo claro: visitante → "Começar grátis" → `/cadastro` → trial ativo, ou → "Assinar Pro" → cadastro com intenção de upgrade.
