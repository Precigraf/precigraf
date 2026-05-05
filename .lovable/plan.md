# Plano: Conversa por ticket + status em tempo real

## O que será entregue

1. **Conversa por ticket** — usuário e equipe trocam mensagens dentro de cada ticket aberto.
2. **Atualização em tempo real** — novas mensagens e mudanças de status aparecem sem recarregar a página (Realtime).
3. **Botão "Marcar como concluído"** — disponível tanto para o próprio usuário (encerrar seu ticket) quanto para admins, com checkmark visível na lista.
4. **Email de suporte alterado** para `precigraf@gmail.com` em todos os pontos da página `/suporte`.

## Mudanças no banco

Nova tabela `support_ticket_messages`:

```text
id              uuid PK
ticket_id       uuid  -> support_tickets.id
user_id         uuid  (autor da mensagem)
author_role     text  ('user' | 'admin')
message         text  (1..4000 chars)
created_at      timestamptz
```

RLS:
- SELECT: dono do ticket OU admin (`has_role(auth.uid(),'admin')`)
- INSERT: dono do ticket OU admin; `user_id = auth.uid()`; `author_role` derivado por trigger (admin se tiver role admin, senão user)
- UPDATE/DELETE: bloqueados

Trigger:
- Ao inserir mensagem: atualiza `support_tickets.updated_at` e, se autor for admin e status = `aberto`, move para `em_andamento`.

Realtime: habilitar replicação para `support_ticket_messages` e `support_tickets` (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`, `REPLICA IDENTITY FULL`).

Status já existente (`aberto`, `em_andamento`, `resolvido`) é mantido. RLS atual de `support_tickets` permite UPDATE só por admin — adicionar policy: usuário dono pode atualizar **apenas** o próprio ticket para mudar `status` de/para `resolvido` (encerrar/reabrir o próprio ticket).

## Mudanças na UI (`src/pages/Suporte.tsx`)

- Constante `SUPPORT_EMAIL` → `precigraf@gmail.com` (atualiza card de email e link `mailto:`).
- Na tabela "Meus tickets", cada linha vira clicável e abre um **Dialog de conversa**:
  - Cabeçalho: assunto, badge de status, botão "Marcar como concluído" (com ícone de check) — desabilitado se já `resolvido`.
  - Lista de mensagens em bolhas (usuário à direita, equipe à esquerda), ordenadas por `created_at`, com data/hora.
  - Campo de envio (Textarea + botão Enviar) com validação Zod (1–4000 chars).
  - Indicador visual quando o ticket está `resolvido` (badge verde com check, campo de envio escondido ou bloqueado).
- Subscriptions Supabase Realtime ao abrir o dialog:
  - Canal `ticket:{id}` escutando `INSERT` em `support_ticket_messages` filtrado por `ticket_id`.
  - Canal escutando `UPDATE` em `support_tickets` filtrado por `id` para refletir mudança de status na hora.
- Lista geral de tickets também escuta `UPDATE` em `support_tickets` do usuário para atualizar status/`updated_at` em tempo real e mostrar ícone de check ao lado dos resolvidos.
- Loading states e `toast` para erros/sucesso seguindo o padrão atual da página.

## Arquivos

- **Migração nova**: cria `support_ticket_messages`, RLS, trigger, e habilita Realtime em ambas as tabelas; adiciona policy de UPDATE de status para o próprio dono.
- **Editado**: `src/pages/Suporte.tsx` (email, dialog de conversa, realtime, botão concluir).
- Sem novas dependências; usa shadcn `Dialog`, `ScrollArea`, `Textarea`, `Button`, `Badge` já presentes.

## Fora do escopo

- Notificações por email a cada nova mensagem (pode ser adicionado depois via edge function).
- Anexos de arquivos.
- Painel administrativo dedicado (admins respondem pelo mesmo dialog acessando a tabela diretamente — uma página `/admin/suporte` pode vir em outro plano).
