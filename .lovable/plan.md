
# Painel Admin Externo — PreciGraf

## Visão geral

Criar uma área administrativa **separada** do app dos usuários, acessível apenas para contas com role `admin`. Layout próprio (sidebar dedicada), rotas isoladas em `/admin/*`, e proteção dupla: client-side (redirect) + server-side (RLS + edge function valida `has_role`).

**Importante sobre credenciais:** por segurança, **não** vou hardcodar email/senha no código. O fluxo correto é:
1. Você se cadastra normalmente em `/cadastro` com `israelwanderley65@gmail.com` e a senha desejada.
2. Eu rodo uma migration que promove esse email para role `admin` na tabela `user_roles` (já existente).
3. A partir daí, ao logar nesse email, o app detecta o role e libera `/admin`.

A senha fica no Supabase Auth (hasheada), não no código — padrão profissional.

## Estrutura de rotas

```text
/admin                      → Dashboard (KPIs)
/admin/usuarios             → Lista, busca, alterar plano, ativar/desativar
/admin/planos               → Gerenciar subscription_plans + ver assinantes
/admin/funcionarios         → Equipe interna (admins, suporte, financeiro)
/admin/permissoes           → Atribuir roles (admin, moderator, support, user)
/admin/pagamentos           → Histórico Stripe + pending_payments
```

Todas envoltas em `<AdminProtectedRoute>` que valida `has_role(user, 'admin')` via RPC.

## Layout

`AdminLayout` separado do `AppLayout`:
- Sidebar própria com itens: Dashboard, Usuários, Planos, Funcionários, Permissões, Pagamentos
- Header com badge "Modo Admin", nome do admin logado, botão "Sair do Admin" (volta para `/app`)
- Tema visual diferenciado (ex: borda/accent vermelho sutil) para deixar claro que é área restrita

## Banco de dados

A maior parte da infra já existe. Mudanças:

1. **Estender enum `app_role`** para incluir novos papéis:
   ```sql
   ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'moderator';
   ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support';
   ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'finance';
   ```

2. **Promover seu usuário a admin** (migration data, após cadastro):
   ```sql
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users WHERE email = 'israelwanderley65@gmail.com'
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

3. **Tabela opcional `payment_history`** (para histórico unificado Stripe + InfinitePay):
   - Já dá pra extrair de `pending_payments` + Stripe API; mantemos simples e listamos via edge function.

4. **RPCs novas** (security definer, validam `has_role(auth.uid(),'admin')`):
   - `admin_get_dashboard_metrics()` → totals (free, pro, MRR, novos no mês)
   - `admin_assign_role(target_user_id, role)`
   - `admin_revoke_role(target_user_id, role)`
   - Já existe `admin-actions` edge function — vamos estendê-la com novas actions: `get_dashboard`, `list_payments`, `assign_role`, `revoke_role`, `list_employees`.

## Dashboard (KPIs)

Cards no topo:
- **Total de usuários** (count `profiles`)
- **Usuários Free** (`plan = 'free'`)
- **Usuários Pro** (`plan = 'pro'`, inclui `pro_monthly` e `lifetime`)
- **MRR / Total assinaturas (R$)** — soma:
  - `pro_monthly` ativos × preço mensal (vem de `subscription_plans` ou constante)
  - + receita lifetime no período

Gráficos:
- Crescimento mensal (já existe em `get_metrics`)
- Distribuição por plano (pizza)
- Conversões trial → pro (últimos 30 dias)

## Páginas

### Usuários (`/admin/usuarios`)
Tabela com: nome, email, plano, status, trial, último login, criado em.
Ações por linha: alterar plano, ativar/desativar, ver detalhes, resetar senha (envia link), forçar logout.
Filtros: plano, status, busca por email/nome. Paginação server-side.

### Planos (`/admin/planos`)
Lista `subscription_plans` (free, pro_monthly, lifetime). Mostra contagem de assinantes por plano, MRR por plano. (Edição de preço fica fora do escopo inicial — preços vivem no Stripe.)

### Funcionários (`/admin/funcionarios`)
Lista usuários com role ≠ `user`. Botão "Adicionar funcionário" → busca por email e atribui role.

### Permissões (`/admin/permissoes`)
Matriz: usuário × roles. Toggle para conceder/revogar. Log toda mudança em `security_logs`.

### Pagamentos (`/admin/pagamentos`)
Tabela unificada: `pending_payments` + dados Stripe (assinaturas ativas, último pagamento). Filtro por status/período. Total recebido no período.

## Segurança (não-negociável)

- Toda RPC e edge function valida `has_role(auth.uid(), 'admin')` antes de qualquer ação.
- RLS continua bloqueando acesso direto a tabelas sensíveis para não-admins (já está assim).
- Toda ação administrativa (mudança de plano, role, status) gera entrada em `security_logs` (já existe padrão).
- Rate limiting na edge function (`check_rate_limit`) para evitar abuso.
- Frontend nunca decide permissão — só esconde UI; servidor é a fonte da verdade.
- **Nada** de hardcoded password/email no código.

## Arquivos a criar/editar

**Novos:**
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminUsers.tsx`
- `src/pages/admin/AdminPlans.tsx`
- `src/pages/admin/AdminEmployees.tsx`
- `src/pages/admin/AdminPermissions.tsx`
- `src/pages/admin/AdminPayments.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminProtectedRoute.tsx`
- `src/hooks/useIsAdmin.ts`

**Editar:**
- `src/App.tsx` — registrar rotas `/admin/*`
- `supabase/functions/admin-actions/index.ts` — novas actions

**Migrations:**
- Estender enum `app_role`
- Promover `israelwanderley65@gmail.com` a admin (após cadastro)

## Ordem de execução

1. Você confirma o plano e me diz se já criou a conta `israelwanderley65@gmail.com` em `/cadastro`. Se não, faz isso primeiro.
2. Migration: estende roles + promove você a admin.
3. Implementa `AdminLayout`, `AdminProtectedRoute`, hook `useIsAdmin`.
4. Cria Dashboard com KPIs reais.
5. Cria Usuários, Planos, Pagamentos.
6. Cria Funcionários e Permissões.
7. Estende edge function `admin-actions`.
8. QA: login com sua conta, valida acesso; login com conta normal, valida bloqueio.

## Pergunta antes de implementar

Você já criou a conta `israelwanderley65@gmail.com` no sistema (via `/cadastro`)? Se ainda não, cria primeiro com a senha desejada — a promoção a admin depende do `user_id` existir em `auth.users`.
