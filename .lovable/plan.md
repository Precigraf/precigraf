## Portal do Cliente — Histórico, 2ª via e arquivos de arte

Área pública (sem necessidade de cadastro) onde o cliente final acessa tudo dele numa URL única por cliente. Aumenta percepção de profissionalismo e reduz mensagens de WhatsApp pedindo "manda o boleto de novo".

---

### Como o cliente acessa

- Cada cliente ganha um `portal_token` (UUID) gerado automaticamente.
- URL: `precigraf.com.br/cliente/{token}` — funciona sem login, igual ao link de aprovação de orçamento e rastreio de pedido (padrão já existente no projeto).
- Dono da gráfica copia o link e envia por WhatsApp / e-mail com 1 clique a partir da ficha do cliente.

---

### O que o cliente vê no portal

1. **Cabeçalho** — logo + nome da gráfica (vem do `profiles`), nome do cliente, contato da gráfica (WhatsApp/e-mail).

2. **Resumo (3 cards no topo)**
   - Pedidos em andamento
   - Pedidos concluídos
   - Valor em aberto (contas a receber pendentes)

3. **Aba "Pedidos"** — lista todos os pedidos do cliente
   - Nº do pedido, data, status (badge colorida igual ao Kanban), valor, link para detalhe/rastreio.
   - Botão "Ver detalhes" abre tela parecida com `RastreioPedido` (já existe).

4. **Aba "Orçamentos"** — lista de orçamentos
   - Status (pendente / aprovado / recusado / ajustes solicitados), valor.
   - Orçamentos pendentes têm botão "Aprovar agora" que leva ao link público existente (`/orcamento/{token}`).

5. **Aba "Financeiro" (2ª via)**
   - Lista de contas a receber: vencimento, valor, status (pendente/pago/atrasado).
   - Botão "Copiar chave Pix" (puxa do `profiles.pix_key`).
   - Botão "Baixar comprovante" quando pago.
   - Espaço pronto para link de boleto/Pix automático em integração futura.

6. **Aba "Arquivos de arte"**
   - Cliente faz upload de arquivos (PDF, AI, CDR, PNG, JPG, ZIP) ligados a um pedido específico ou "geral".
   - Vê lista do que já enviou + arquivos que a gráfica enviou para ele (prova, arte final).
   - Limite de 25MB por arquivo, até 10 arquivos por pedido.

---

### O que o dono da gráfica ganha (lado interno)

- Na ficha do cliente (`/clientes`): botão **"Copiar link do portal"** e **"Enviar por WhatsApp"**.
- Nos detalhes do pedido: aba **"Arquivos do cliente"** mostrando o que foi enviado, com botão de download.
- Notificação automática (sistema atual de `notifications`) quando o cliente envia um arquivo novo.

---

### Mudanças no banco

**1. Coluna em `clients`**
- `portal_token UUID UNIQUE DEFAULT gen_random_uuid()` — backfill automático para clientes existentes.

**2. Nova tabela `client_files`**
- `id, user_id, client_id, order_id (nullable), uploaded_by ('client' | 'owner'), file_name, file_path, file_size, mime_type, created_at`
- RLS: dono vê os seus (`auth.uid() = user_id`), público sem acesso direto (acesso via RPC com token).

**3. Bucket de storage `client-portal`** (privado)
- Estrutura: `{user_id}/{client_id}/{file_id}-{nome}`
- Policies: somente service role / RPCs leem; uploads via Edge Function que valida o token.

**4. RPCs públicas (SECURITY DEFINER, seguem padrão `get_quote_by_token`)**
- `get_client_portal(p_token uuid)` → retorna cliente + lista de pedidos, orçamentos, recebíveis, arquivos.
- `list_client_portal_files(p_token uuid, p_order_id uuid default null)` → lista arquivos com signed URLs.
- `register_client_portal_upload(p_token, p_order_id, p_file_name, p_file_path, p_size, p_mime)` → grava registro após upload + cria notificação para o dono.

**5. Edge Function `client-portal-upload`**
- Recebe token + arquivo, valida token → cliente, faz upload no bucket usando service role, chama `register_client_portal_upload`. Rate limit por token (já existe `check_rate_limit`).

---

### Frontend

**Novas rotas (públicas, em `App.tsx`)**
- `/cliente/:token` → `PortalCliente.tsx`

**Novos arquivos**
- `src/pages/PortalCliente.tsx` — layout em cards + tabs (Pedidos, Orçamentos, Financeiro, Arquivos), mesmo padrão visual do `AprovacaoOrcamento` e `RastreioPedido` (max-w-4xl, light theme forçado, cards limpos).
- `src/components/portal/PortalHeader.tsx`, `PortalOrdersList.tsx`, `PortalQuotesList.tsx`, `PortalReceivablesList.tsx`, `PortalFilesTab.tsx`.

**Alterações em arquivos existentes**
- `src/pages/Clientes.tsx` — botão "Portal do cliente" no card/linha do cliente (copia link + abre WhatsApp).
- `src/components/gestao/OrderDetailsModal.tsx` — nova aba/seção "Arquivos do cliente".
- `src/lib/publicUrl.ts` — adicionar `buildClientPortalUrl(token)`.

---

### Fora de escopo desta entrega

- Geração automática de boleto/Pix (fica para integração futura — o portal já reserva o espaço visual).
- Login com senha para o cliente (link com token já dá o nível de segurança usado nos outros fluxos públicos do projeto).
- Edição de cadastro pelo próprio cliente.

---

### Ordem de implementação (1 PR)

1. Migration: coluna `portal_token` + tabela `client_files` + bucket + RPCs.
2. Edge Function de upload.
3. Página `/cliente/:token` com todas as tabs.
4. Botões no painel do dono (Clientes + OrderDetailsModal).
5. Smoke test manual: gerar link, abrir, listar pedido, subir arquivo, ver notificação.

Quer ajustar alguma aba antes de eu começar? Se estiver bom, é só aprovar que sigo.