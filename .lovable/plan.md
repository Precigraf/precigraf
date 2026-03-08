

## Análise: Algoritmo Iterativo de Precificação Shopee 2026

### Situação Atual

O sistema atual calcula taxas de marketplace de forma **aditiva simples**:
- `preçoBase = custoProduçao + lucroDesejado`
- `taxas = preçoBase × comissão% + taxaFixa`
- `preçoFinal = preçoBase + taxas`

Problemas com essa abordagem:
1. **Não embute as taxas no preço** — a comissão deveria incidir sobre o preço final, não sobre o preço base
2. **Faixas de comissão fixas** — usa 14% ou 20% fixo, sem considerar que a faixa muda conforme o preço final
3. **Não suporta** imposto sobre venda, taxa CPF, custos de Ads/ROAS

### O que será implementado

**É totalmente cabível.** A mudança principal é substituir o cálculo linear por um solver iterativo e adicionar novos campos de entrada.

### Plano de Implementação

#### 1. Criar módulo de cálculo Shopee (`src/lib/shopeeUtils.ts`)

Conterá:
- Tabela de faixas de comissão 2026 (5 faixas conforme especificado)
- Função `consultarFaixa(preco)` → retorna `{comissao, tarifaFixa}`
- Função `calcularPrecoShopee(params)` com o solver iterativo (máx 20 iterações, convergência < R$ 0,01)
- Cálculo do preço psicológico: `Math.ceil(precoIdeal) - 0.10`
- Validação de denominador ≤ 0 (margem impossível)

Parâmetros de entrada:
```text
custoProduto, custoEmbalagem, margemDesejada%,
impostoVenda%, taxaCPF (R$3 ou 0), adsFixo (R$), roasAds (número)
```

#### 2. Expandir MarketplaceSection com novos campos

Quando Shopee for selecionado, exibir campos adicionais:
- **Tipo de vendedor**: CPF (+ R$ 3,00) ou CNPJ
- **Imposto sobre venda** (%): campo numérico
- **Investimento em Ads** (R$): valor fixo por produto
- **ROAS**: retorno sobre investimento em ads

Remover os campos de comissão/taxa fixa manuais quando Shopee estiver selecionado (serão calculados automaticamente pelo solver).

#### 3. Integrar solver no CostCalculator

No `useMemo` de cálculos (linha ~329), quando marketplace for Shopee:
- Chamar `calcularPrecoShopee()` em vez do cálculo linear atual
- O solver retorna: preço ideal, preço psicológico, comissão aplicada, tarifa fixa aplicada, faixa utilizada
- Mapear os valores retornados para as props existentes do `ResultPanel`

#### 4. Atualizar ResultPanel e QuantitySimulator

- Exibir a faixa de comissão aplicada (ex: "Faixa: R$ 80-99,99 → 14% + R$ 16")
- Mostrar preço psicológico como sugestão
- Mostrar custos de Ads e impostos no detalhamento
- Alerta quando margem for matematicamente impossível
- Sincronizar QuantitySimulator com a lógica do solver (recalcular por quantidade)

#### 5. Manter compatibilidade

- Marketplace "custom" e "none" continuam com cálculo linear atual
- Os dados salvos no banco não mudam de estrutura
- Shopee sem frete e com frete serão unificados (a faixa determina a comissão automaticamente)

### Escopo Técnico

- **Arquivos novos**: `src/lib/shopeeUtils.ts`
- **Arquivos alterados**: `MarketplaceSection.tsx`, `CostCalculator.tsx`, `ResultPanel.tsx`, `QuantitySimulator.tsx`
- **Sem mudanças no banco de dados**
- **Sem dependências novas**

