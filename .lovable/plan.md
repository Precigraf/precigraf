

## Página de Admin — Gerenciamento do Sistema

### Pré-requisito: Definir seu usuario como admin
Seu e-mail principal (`israelwanderley65@gmail.com`, ID: `f8571a55-...`) nao tem registro na tabela `user_roles`. Sera necessario inserir o role `admin` via migração SQL.

---

### 1. Migração SQL — Inserir admin + criar edge function para operações admin

**Migração:**
- Inserir `(f8571a55-0d50-4128-bf3b-9a56c6e2250b, 'admin')` na tabela `user_roles`

**Edge function `admin-actions`:**
- Valida JWT e verifica role `admin` via `has_role()`
- Ações suportadas:
  - `list_users` — lista todos os usuarios com perfil, plano e status
  - `update_user_plan` — altera plano de um usuario (free/pro)
  - `toggle_user_status` — ativa/desativa usuario
  - `delete_user` — remove usuario via Supabase Admin API
  - `get_metrics` — retorna metricas do sistema (total usuarios, receita, conversoes)
  - `get_security_logs` — retorna logs de segurança paginados

---

### 2. Nova página `/admin`
**Arquivo:** `src/pages/Admin.tsx`

Abas principais:
- **Usuarios** — tabela com nome, e-mail, plano, status, data de cadastro, acoes (alterar plano, bloquear, excluir)
- **Metricas** — cards com total de usuarios, usuarios pro, novos no mes, receita estimada, taxa de conversao trial→pro
- **Planos** — visualizacao dos planos existentes (free, pro_monthly, lifetime) com contagem de usuarios em cada
- **Logs de Segurança** — tabela paginada com eventos (login, payment, suspicious_device, etc.) e filtro por tipo/periodo

---

### 3. Proteção de rota admin
**Novo componente:** `src/components/AdminRoute.tsx`
- Verifica se usuario autenticado tem role `admin` consultando `user_roles`
- Se nao for admin, redireciona para `/gestao`
- Usa a funcao `has_role` do banco via RPC

**Arquivo:** `src/App.tsx`
- Adicionar rota `/admin` com `AdminRoute` wrapper

---

### 4. Link no sidebar (apenas para admins)
**Arquivo:** `src/components/AppSidebar.tsx`
- Adicionar item "Admin" com icone `Shield` no final do menu
- Visivel apenas quando o usuario logado tem role `admin` (consulta via hook `useIsAdmin`)

**Novo hook:** `src/hooks/useIsAdmin.ts`
- Consulta `user_roles` para o usuario logado e retorna `true/false`

---

### 5. Funcionalidades detalhadas

**Aba Usuarios:**
- Busca via edge function `admin-actions` (action: `list_users`)
- Colunas: Nome, E-mail, Plano, Status (ativo/inativo), Cadastro, Acoes
- Botao para alterar plano (Select: free/pro)
- Botao para bloquear/desbloquear
- Botao para excluir (com confirmacao)

**Aba Metricas:**
- Total de usuarios cadastrados
- Usuarios Pro (lifetime + pro_monthly ativos)
- Novos usuarios no mes
- Taxa de conversao (trial → pro)
- Grafico de crescimento de usuarios por mes

**Aba Planos:**
- Lista `subscription_plans` com contagem de usuarios em cada
- Visualizacao apenas (sem edicao, pois planos sao gerenciados via migracao)

**Aba Logs:**
- Tabela com `security_logs` (evento, usuario, descricao, data)
- Filtro por tipo de evento e periodo
- Paginacao (50 por pagina)

---

### Arquivos criados/editados
| Arquivo | Ação |
|---|---|
| `supabase/migrations/...admin_role.sql` | Inserir admin role |
| `supabase/functions/admin-actions/index.ts` | Edge function admin |
| `src/pages/Admin.tsx` | Pagina admin completa |
| `src/components/AdminRoute.tsx` | Proteção de rota |
| `src/hooks/useIsAdmin.ts` | Hook de verificação |
| `src/components/AppSidebar.tsx` | Link admin condicional |
| `src/App.tsx` | Rota `/admin` |

