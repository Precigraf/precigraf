

## Exportar PDF de Orçamento como Download Direto

### Problema
Ao exportar o PDF do orçamento, o sistema abre uma nova aba no navegador e chama `window.print()`. Isso força o usuário a interagir com o diálogo de impressão do navegador.

### Solução
Substituir a lógica de `window.open` + `window.print()` por geração direta com **jsPDF** (já instalado no projeto), gerando um arquivo `.pdf` que é baixado automaticamente via `doc.save()`.

### Alteração

**Arquivo:** `src/pages/OrcamentoEditor.tsx`

Reescrever a função `handleExportPDF` (linhas 352-416) para:

1. Criar um documento `jsPDF`
2. Renderizar o cabeçalho da empresa (nome, documento, telefone, e-mail, endereço) — e logo se disponível (usando `doc.addImage`)
3. Renderizar título "Orçamento ORC-XXXX" + data
4. Renderizar nome do cliente
5. Renderizar tabela de itens (usando `jspdf-autotable`, já importado em `exportUtils.ts`)
6. Renderizar resumo: Subtotal, Desconto, Frete, Total
7. Renderizar observações (se houver)
8. Renderizar validade (se houver)
9. Chamar `doc.save('orcamento-ORC-XXXX.pdf')` para download direto

A logo será carregada como imagem base64 via canvas antes de inserir no PDF (necessário para jsPDF com URLs externas).

### Escopo
Apenas o arquivo `src/pages/OrcamentoEditor.tsx` será alterado. Os imports de `jsPDF` e `autoTable` serão adicionados.

