
# Portal unificado do cliente (orçamento → pagamento → rastreio)

Tudo num único link já existente: **`/orcamento/{public_token}`**. Não envia mais dois links separados.

## Fluxo do cliente

```text
1. Recebe link /orcamento/{token}
2. Vê orçamento → [Aprovar] [Solicitar ajustes] [Recusar]
3. Ao aprovar → mesma tela revela:
     • Pix (chave + QR copiável + valor)
     • Botão "Pagar com cartão (InfinityPay)" → abre link da maquininha
     • Botão "Já paguei" (sem comprovante)
4. Após aprovação, mesma tela mostra:
     • Stepper do pedido: Aprovado → Arte → Produção → Embalagem → Entregue
     • Código de rastreio (quando preenchido)
     • Status do pagamento (Pendente / Marcado como pago / Confirmado)
```

Voltando ao link depois, o cliente cai direto na visão de acompanhamento — sem precisar reaprovar.

## O que muda na sua área (admin)

- **Perfil → Pagamento**: novos campos
  - Chave Pix (já existe `pix_key`)
  - **Link InfinityPay** (novo: `infinitypay_url`)
- **Financeiro / Pedidos**: notificação "Cliente marcou como pago — confirmar recebimento". Botão confirma o `receivable` e libera badge "Pago" no portal.
- Nada no Kanban/Produção muda; pedido entra normalmente após aprovação (sem bloqueio por pagamento, conforme escolhido).

## Mudanças técnicas (resumo)

**Banco (migration):**
- `profiles.infinitypay_url text`
- `quotes.client_marked_paid_at timestamptz` (cliente clicou "já paguei")
- RPC `mark_quote_paid_by_token(p_token, p_method)` — registra em `quotes` + cria notificação para o dono
- Estender `get_quote_by_token` para retornar: `pix_key`, `infinitypay_url`, `order` vinculado (status, tracking_code, stepper), `payment_status`

**Frontend:**
- `src/pages/AprovacaoOrcamento.tsx` — vira o portal completo, com 3 estados:
  1. **Pendente** — orçamento + ações
  2. **Aprovado, aguardando pagamento** — bloco Pix + InfinityPay + "Já paguei"
  3. **Pago/Em produção** — stepper + rastreio (resumo do orçamento colapsável)
- `src/pages/Perfil.tsx` — campo "Link InfinityPay" (com tooltip de como copiar da maquininha)
- `src/hooks/useCompanyProfile.ts` — incluir `infinitypay_url`
- Nada removido; `RastreioPedido.tsx` continua existindo (compatibilidade), mas o link enviado passa a ser sempre o do orçamento.

**Segurança:**
- Tudo via RPCs SECURITY DEFINER + token. Nenhuma exposição direta de tabelas.
- Rate limit em `mark_quote_paid_by_token` (1 chamada / 10s por token).

## Fora do escopo (confirme se quiser incluir depois)
- Confirmação automática de Pix (precisaria gateway tipo Mercado Pago/Stripe).
- Histórico de outros orçamentos do mesmo cliente no portal.
- Upload de comprovante.

Aprove para eu implementar.
