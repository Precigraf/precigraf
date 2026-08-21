# Novo cabeçalho do Template Clássico

Atualização visual/estrutural apenas do Modelo 01 (Catálogo Clássico) e da seção "Marca" do editor. Banco, autosave, upload, exportação, lista de catálogos e demais seções permanecem intocados.

## Nova hierarquia

```text
┌──────────────────────────────────────────────┐
│            [LOGO] NOME DA MARCA              │
│           S L O G A N   (opcional)           │
├──────────────────────────────────────────────┤
│  ┌───────────────┐   Sacolinha Mini          │
│  │               │   P E R S O N A L I Z A D A│
│  │     FOTO      │   Tabela de valores       │
│  │               │   20 un        R$ 3,50    │
│  └───────────────┘   Ideal para  [ ][ ][ ]   │
├──────────────────────────────────────────────┤
│   MEDIDA    ALÇA    PAPEL    ACABAMENTO      │
└──────────────────────────────────────────────┘
```

## O que muda

1. **Cabeçalho da marca centralizado** no topo, em toda a largura útil do catálogo: logo e nome na mesma linha (grupo único centralizado com flex), slogan centralizado abaixo em fonte menor, caixa alta, tracking amplo e cor secundária. Altura limitada a ~15% da altura total do template.
2. **Logo** com limites de largura/altura e `object-fit: contain` — funciona com logo quadrada, vertical ou horizontal, sem distorção. Sem posicionamentos fixos.
3. **Linha divisória** abaixo do cabeçalho, usando a cor secundária com baixa opacidade, respeitando as margens internas.
4. **Produto sai do canto superior direito** e passa para o topo da coluna direita da área principal, alinhado ao topo da fotografia.
5. **Título em uma linha**: `title` + `highlight` renderizados juntos ("Sacolinha Mini"), com o highlight na cor secundária; subtítulo logo abaixo em caixa alta, fonte menor, tracking maior e cor discreta. Fonte reduz progressivamente para títulos longos e só quebra linha em último caso — sem overflow.
6. **Espaçamentos** ajustados para caber a tabela, "Ideal para" e o rodapé sem apertar a foto: redução vem de gaps/paddings, não do tamanho dos elementos.
7. **Adaptação automática de visibilidade**: ocultar logo, nome ou slogan não deixa espaço vazio. Novo switch "Mostrar nome da marca" na seção Marca.
8. **Layout do cabeçalho** (Marca): opções "Centralizado" (novo padrão) e "Lateral" (comportamento atual preservado), com a estrutura pronta para variantes futuras.

## Detalhes técnicos

- `src/lib/catalogBuilder/types.ts`: adicionar `showName: boolean` e `headerLayout: 'centered' | 'side'` em `CatalogBrand`, com defaults `true` / `'centered'` em `createDefaultConfig()`. Catálogos já salvos recebem os defaults via normalização na leitura (campos ausentes → padrão), sem migração de banco.
- `src/components/catalogos/templates/ClassicCatalog.tsx`: extrair o cabeçalho em `BrandHeader` (variantes centered/side) e criar `ProductTitleBlock` reutilizando `fitFont` para o ajuste de fonte; foto, tabela, "Ideal para" e rodapé mantêm a implementação atual, só mudam de posição/espaçamento.
- `src/components/catalogos/sections/BrandSection.tsx`: switch "Mostrar nome da marca" e seletor "Layout do cabeçalho".
- Preview e exportação continuam usando o mesmo componente — nenhuma alteração em `export.ts`, `CatalogPreview` ou `CatalogTemplateRenderer`. Composição fixa 4:3, apenas escalada no preview.

## Verificação

Testes com logo quadrada/horizontal, título curto e longo, com e sem slogan/nome/logo, comparando preview e os arquivos PNG, JPEG e PDF.
