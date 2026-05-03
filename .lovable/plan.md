# Plano de Atualização da Landing Page

## 1. Landing como rota raiz (precigraf.com.br → /lp)

Atualmente o domínio raiz (`/`) está protegido e redireciona usuários não logados para `/auth`. Vamos tornar a landing a página pública padrão, mantendo o app autenticado em outra rota.

**Alterações em `src/App.tsx`:**
- `/` passa a renderizar `<LandingPage />` (rota pública).
- Criar `/app` como rota protegida que renderiza `<Index />` (a calculadora).
- Manter `/lp` como alias da landing (para não quebrar links existentes).

**Ajustes de navegação interna:**
- `src/components/landing/LandingNav.tsx`: quando o usuário estiver logado, "Ir para o app" aponta para `/app` em vez de `/`.
- `src/pages/LandingPage.tsx`: `ctaPrimary` para usuário logado vira `/app`.
- `src/components/Header.tsx`: link do logo e item "Calculadora" passam a apontar para `/app`.
- `src/components/AppSidebar.tsx`: ajustar item "Calculadora"/Dashboard para `/app` (verificar e atualizar somente se apontar para `/`).
- `src/pages/Auth.tsx` e `src/pages/Cadastro.tsx`: após login/cadastro bem-sucedido, redirecionar para `/app` (em vez de `/`).
- `src/components/ProtectedRoute.tsx`: quando não logado, redirecionar para `/` (landing) em vez de `/auth`, para manter o funil de marketing — exceto se a intenção do usuário era a área logada (nesse caso `/auth` continua sendo destino do botão "Entrar").

Resultado: ao acessar precigraf.com.br, o visitante vê a landing; clicar nos CTAs leva para `/cadastro` ou `/auth`.

## 2. Botão flutuante de WhatsApp

Criar `src/components/landing/WhatsAppFloat.tsx`:
- Botão fixo `bottom-6 right-6` (z-50), redondo, verde WhatsApp (`bg-[#25D366]`), sombra forte, hover scale.
- Ícone do `WhatsAppIcon` já existente em `src/components/WhatsAppIcon.tsx`.
- Link: `https://wa.me/5574981209228?text=Olá! Tenho interesse no PreciGraf.` com `target="_blank"` e `rel="noopener noreferrer"`.
- Tooltip/label opcional "Fale conosco" visível em hover (desktop).
- Pequeno pulso animado (`animate-ping` em ring atrás) para chamar atenção sem poluir.
- Acessibilidade: `aria-label="Falar no WhatsApp"`.

Renderizar em `src/pages/LandingPage.tsx` (apenas na landing, não no app).

## 3. Refinar `HeroMockup` com novos dados (sacola personalizada)

Editar `src/components/landing/HeroMockup.tsx`:

**Card de inputs (esquerda):**
- Título: "Sacola Personalizada" — "100 unidades".
- Linhas:
  - Papel Offset 180g — R$ 56,80
  - Alça — R$ 11,00
  - Mão de obra — R$ 9,25
  - Custos operacionais — R$ 11,60
  - Acabamento (laminação) — R$ 27,00
- Custo total: R$ 104,05.

**Card de resultado (direita) — versão mais profissional/atraente:**
- Manter fundo `bg-foreground text-background`, mas adicionar:
  - Badge superior pequeno "Sugestão inteligente" com ícone `Sparkles`.
  - Preço em maior destaque: `text-5xl sm:text-6xl`, com linha decorativa fina abaixo.
  - Subtítulo "com margem real de **89,60%**" (negrito no número).
  - Mini "barra de saúde" da margem (gradiente cinza→branco) preenchida ~90% para sinal visual.
  - Grid 2 colunas refinada:
    - Margem: 89,60%
    - Lucro: R$ 93,22
  - Cada card interno com borda translúcida (`border border-background/15`) + hover sutil, ícone em círculo `bg-background/15`.
  - Rodapé com micro-linha "Recalculado em tempo real" + ponto verde piscando (status).
- Valores atualizados: Preço final R$ 197,27, Margem 89,60%, Lucro R$ 93,22.

Sem mudanças no contraste/identidade (segue minimalista monocromático).

## Resumo de Arquivos

**Criados:**
- `src/components/landing/WhatsAppFloat.tsx`

**Editados:**
- `src/App.tsx` (rotas: `/` = landing pública, `/app` = calculadora protegida)
- `src/pages/LandingPage.tsx` (CTA logado → `/app`, montar `WhatsAppFloat`)
- `src/components/landing/LandingNav.tsx` (logado → `/app`)
- `src/components/landing/HeroMockup.tsx` (novos dados + refino visual do card de resultado)
- `src/components/Header.tsx` (logo e "Calculadora" → `/app`)
- `src/components/AppSidebar.tsx` (ajustar item raiz se necessário)
- `src/pages/Auth.tsx`, `src/pages/Cadastro.tsx` (redirect pós-login → `/app`)
- `src/components/ProtectedRoute.tsx` (não logado → `/` se vier de área protegida do app, mantendo `/auth` apenas via botão "Entrar")
