

## 1. Categorias de Produtos

### Migração SQL
Criar tabela `product_categories`:
- `id` UUID PK
- `user_id` UUID NOT NULL (ref auth.users, ON DELETE CASCADE)
- `name` TEXT NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT now()
- UNIQUE(user_id, name)
- RLS: usuario so ve/edita suas categorias

Adicionar coluna `category_id` UUID nullable na tabela `products` com FK para `product_categories(id)` ON DELETE SET NULL.

### Hook `src/hooks/useCategories.ts`
- CRUD para categorias (list, create, delete)
- Usa `supabase.from('product_categories')`

### Componente de gerenciamento de categorias
- Dialog com lista de categorias existentes + input para criar nova
- Botao de excluir categoria (com confirmacao)

### Pagina Produtos (`src/pages/Produtos.tsx`)
- Botao "Criar Categoria" ao lado de "+ Novo Produto"
- Abre dialog de gerenciamento de categorias
- Filtro por categoria acima da lista de produtos
- Badge com nome da categoria em cada card de produto

### Formulario de Produto (`src/components/gestao/ProductForm.tsx`)
- Adicionar Select para vincular produto a uma categoria (opcional)

### Hook `useProducts`
- Incluir `category_id` no tipo `Product` e nas queries

---

## 2. Corrigir formatacao do Desconto no PDF

### Problema
O caractere `−` (Unicode U+2212) nao e suportado pela fonte Helvetica do jsPDF, renderizando como `"` no PDF.

### Correcao
**Arquivo:** `src/pages/OrcamentoEditor.tsx` (linha 475)

Substituir:
```
`−${formatCurrency(discountAmount)}`
```
Por:
```
`-${formatCurrency(discountAmount)}`
```

Mesma correcao na linha 482 do Frete (trocar `+` Unicode se houver) — verificar que usa ASCII padrao.

