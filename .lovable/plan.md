
## Problema
Quando a sidebar está colapsada (modo `icon`, ~3rem de largura), a logo no `SidebarHeader` não fica centralizada/encaixada — provavelmente por padding/alinhamento fixos pensados para o estado expandido.

## Investigação necessária
- Ler `src/components/AppSidebar.tsx` para ver como o header e a logo estão renderizados.
- Confirmar uso de `useSidebar().state` para ajustar layout no estado colapsado.

## Correção
Em `src/components/AppSidebar.tsx`, no `SidebarHeader`:
- Detectar `state === "collapsed"` via `useSidebar()`.
- Quando colapsado: centralizar a logo (`justify-center`), remover textos/wordmark ao lado, e reduzir a logo a um ícone que caiba em `--sidebar-width-icon` (3rem).
- Quando expandido: manter layout atual (logo + nome).

Resultado: a logo fica centralizada e proporcional dentro da faixa estreita ao minimizar, sem transbordar nem ficar deslocada à esquerda.
