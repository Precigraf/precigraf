/**
 * Shopee 2026 - Solver Iterativo de Precificação
 * 
 * Embute comissões e taxas no preço final de venda,
 * garantindo a margem de lucro desejada após todas as deduções.
 */

export interface ShopeeRateTier {
  minPrice: number;
  maxPrice: number;
  commissionRate: number;
  fixedFee: number;
  label: string;
}

// Tabela de taxas Shopee 2026
export const SHOPEE_RATE_TIERS: ShopeeRateTier[] = [
  { minPrice: 0, maxPrice: 79.99, commissionRate: 0.20, fixedFee: 4, label: 'R$ 0 – R$ 79,99' },
  { minPrice: 80, maxPrice: 99.99, commissionRate: 0.14, fixedFee: 16, label: 'R$ 80 – R$ 99,99' },
  { minPrice: 100, maxPrice: 199.99, commissionRate: 0.14, fixedFee: 20, label: 'R$ 100 – R$ 199,99' },
  { minPrice: 200, maxPrice: 499.99, commissionRate: 0.14, fixedFee: 26, label: 'R$ 200 – R$ 499,99' },
  { minPrice: 500, maxPrice: Infinity, commissionRate: 0.14, fixedFee: 26, label: 'Acima de R$ 500' },
];

/**
 * Consulta a faixa de comissão com base no preço unitário
 */
export function consultarFaixa(preco: number): ShopeeRateTier {
  const safePreco = Math.max(0, preco);
  for (const tier of SHOPEE_RATE_TIERS) {
    if (safePreco >= tier.minPrice && safePreco <= tier.maxPrice) {
      return tier;
    }
  }
  // Fallback: última faixa
  return SHOPEE_RATE_TIERS[SHOPEE_RATE_TIERS.length - 1];
}

export interface ShopeeCalcParams {
  /** Custo total de produção por unidade (matéria-prima + operacional rateado) */
  custoProduto: number;
  /** Custo de embalagem por unidade (já incluso em custoProduto normalmente) */
  custoEmbalagem: number;
  /** Margem de lucro desejada (decimal, ex: 0.30 = 30%) */
  margemDesejada: number;
  /** Imposto sobre venda (decimal, ex: 0.06 = 6%) */
  impostoVenda: number;
  /** Taxa CPF por pedido (R$ 3,00 se CPF, 0 se CNPJ) */
  taxaCPF: number;
  /** Investimento fixo em Ads por produto (R$) */
  adsFixo: number;
  /** ROAS (Return on Ad Spend). Ex: 5.0 significa que cada R$1 gera R$5 em vendas */
  roasAds: number;
  /** Quantidade do lote (para rateio de taxa fixa por pedido) */
  quantidade: number;
}

export interface ShopeeCalcResult {
  /** Preço ideal calculado (unitário) */
  precoIdeal: number;
  /** Preço psicológico (unitário) */
  precoPsicologico: number;
  /** Faixa de comissão aplicada */
  faixaAplicada: ShopeeRateTier;
  /** Comissão efetiva (decimal) */
  comissaoEfetiva: number;
  /** Tarifa fixa por pedido aplicada */
  tarifaFixaAplicada: number;
  /** Taxa CPF aplicada */
  taxaCPFAplicada: number;
  /** Custo de Ads variável por unidade */
  custoAdsVariavel: number;
  /** Custo de Ads fixo por unidade */
  custoAdsFixo: number;
  /** Imposto por unidade */
  impostoValor: number;
  /** Total de taxas marketplace por unidade */
  totalTaxasMarketplace: number;
  /** Lucro por unidade */
  lucroPorUnidade: number;
  /** Iterações usadas para convergir */
  iteracoes: number;
  /** Se a margem é matematicamente impossível */
  margemImpossivel: boolean;
  /** Mensagem de erro (se houver) */
  erro?: string;
}

/**
 * Solver iterativo para precificação Shopee 2026
 * 
 * Embute taxas dinâmicas no preço final para garantir a margem desejada.
 * Converge em até 20 iterações com tolerância de R$ 0,01.
 */
export function calcularPrecoShopee(params: ShopeeCalcParams): ShopeeCalcResult {
  const {
    custoProduto,
    custoEmbalagem,
    margemDesejada,
    impostoVenda,
    taxaCPF,
    adsFixo,
    roasAds,
    quantidade,
  } = params;

  const safeQuantidade = Math.max(1, Math.floor(quantidade || 1));
  const safeCustoProduto = Math.max(0, custoProduto || 0);
  const safeCustoEmbalagem = Math.max(0, custoEmbalagem || 0);
  const safeMargem = Math.max(0, margemDesejada || 0);
  const safeImposto = Math.max(0, Math.min(impostoVenda || 0, 0.99));
  const safeTaxaCPF = Math.max(0, taxaCPF || 0);
  const safeAdsFixo = Math.max(0, adsFixo || 0);
  const safeRoas = Math.max(0, roasAds || 0);

  // Custo variável de Ads (percentual do preço)
  const custoAdsVar = safeRoas > 0 ? 1 / safeRoas : 0;

  // Taxa CPF rateada por unidade (é por pedido)
  const taxaCPFPorUnidade = safeTaxaCPF / safeQuantidade;

  // Ads fixo por unidade
  const adsFixoPorUnidade = safeAdsFixo;

  // Custos fixos por unidade (que não dependem do preço)
  const custosFixosPorUnidade = safeCustoProduto + safeCustoEmbalagem + taxaCPFPorUnidade + adsFixoPorUnidade;

  // Estimativa inicial com comissão de 14%
  const denominadorInicial = 1 - 0.14 - safeMargem - safeImposto - custoAdsVar;
  
  if (denominadorInicial <= 0) {
    return criarResultadoImpossivel(params, custoAdsVar);
  }

  let precoAnterior = (custosFixosPorUnidade + 4) / denominadorInicial; // +4 como tarifa fixa mínima

  const MAX_ITERACOES = 20;
  let iteracoes = 0;

  for (let i = 0; i < MAX_ITERACOES; i++) {
    iteracoes = i + 1;

    // Consultar faixa com base no preço atual
    const faixa = consultarFaixa(precoAnterior);
    
    // Tarifa fixa por pedido, rateada por unidade
    const tarifaFixaPorUnidade = faixa.fixedFee / safeQuantidade;

    // Denominador da fórmula de equilíbrio
    const denominador = 1 - faixa.commissionRate - safeMargem - safeImposto - custoAdsVar;

    if (denominador <= 0) {
      return criarResultadoImpossivel(params, custoAdsVar);
    }

    // Fórmula de equilíbrio
    const novoPreco = (custosFixosPorUnidade + tarifaFixaPorUnidade) / denominador;

    // Verificar estabilidade
    if (Math.abs(novoPreco - precoAnterior) < 0.01) {
      return montarResultado(novoPreco, faixa, params, custoAdsVar, iteracoes);
    }

    precoAnterior = novoPreco;
  }

  // Convergiu no limite de iterações
  const faixaFinal = consultarFaixa(precoAnterior);
  return montarResultado(precoAnterior, faixaFinal, params, custoAdsVar, iteracoes);
}

function montarResultado(
  preco: number,
  faixa: ShopeeRateTier,
  params: ShopeeCalcParams,
  custoAdsVar: number,
  iteracoes: number,
): ShopeeCalcResult {
  const safeQuantidade = Math.max(1, Math.floor(params.quantidade || 1));
  const precoIdeal = Math.round(preco * 100) / 100;
  
  // Preço psicológico: arredondar pra cima e subtrair 0.10
  const precoPsicologico = Math.ceil(precoIdeal) - 0.10;
  
  // Taxas calculadas
  const comissaoValor = precoIdeal * faixa.commissionRate;
  const tarifaFixaPorUnidade = faixa.fixedFee / safeQuantidade;
  const taxaCPFPorUnidade = (params.taxaCPF || 0) / safeQuantidade;
  const impostoValor = precoIdeal * (params.impostoVenda || 0);
  const custoAdsVariavel = precoIdeal * custoAdsVar;
  const custoAdsFixo = params.adsFixo || 0;
  
  const totalTaxasMarketplace = comissaoValor + tarifaFixaPorUnidade + taxaCPFPorUnidade;
  
  const custoProdTotal = (params.custoProduto || 0) + (params.custoEmbalagem || 0);
  const lucroPorUnidade = precoIdeal - custoProdTotal - totalTaxasMarketplace - impostoValor - custoAdsVariavel - custoAdsFixo;

  return {
    precoIdeal,
    precoPsicologico: Math.round(precoPsicologico * 100) / 100,
    faixaAplicada: faixa,
    comissaoEfetiva: faixa.commissionRate,
    tarifaFixaAplicada: faixa.fixedFee,
    taxaCPFAplicada: params.taxaCPF || 0,
    custoAdsVariavel: Math.round(custoAdsVariavel * 100) / 100,
    custoAdsFixo,
    impostoValor: Math.round(impostoValor * 100) / 100,
    totalTaxasMarketplace: Math.round(totalTaxasMarketplace * 100) / 100,
    lucroPorUnidade: Math.round(lucroPorUnidade * 100) / 100,
    iteracoes,
    margemImpossivel: false,
  };
}

function criarResultadoImpossivel(params: ShopeeCalcParams, custoAdsVar: number): ShopeeCalcResult {
  const margemPct = Math.round((params.margemDesejada || 0) * 100);
  const impostoPct = Math.round((params.impostoVenda || 0) * 100);
  const adsPct = Math.round(custoAdsVar * 100);
  
  return {
    precoIdeal: 0,
    precoPsicologico: 0,
    faixaAplicada: SHOPEE_RATE_TIERS[0],
    comissaoEfetiva: 0,
    tarifaFixaAplicada: 0,
    taxaCPFAplicada: 0,
    custoAdsVariavel: 0,
    custoAdsFixo: 0,
    impostoValor: 0,
    totalTaxasMarketplace: 0,
    lucroPorUnidade: 0,
    iteracoes: 0,
    margemImpossivel: true,
    erro: `A margem de ${margemPct}% + imposto de ${impostoPct}% + ads de ${adsPct}% + comissão Shopee excede 100%. Reduza a margem ou custos variáveis.`,
  };
}

/**
 * Calcula o preço Shopee para uma quantidade específica (usado no QuantitySimulator)
 */
export function calcularPrecoShopeePorQuantidade(
  custoProdutoPorUnidade: number,
  operationalTotal: number,
  margemDesejada: number,
  impostoVenda: number,
  taxaCPF: number,
  adsFixo: number,
  roasAds: number,
  quantidade: number,
): ShopeeCalcResult {
  const safeQty = Math.max(1, Math.floor(quantidade));
  const unitOperationalCost = operationalTotal / safeQty;
  
  return calcularPrecoShopee({
    custoProduto: custoProdutoPorUnidade + unitOperationalCost,
    custoEmbalagem: 0,
    margemDesejada,
    impostoVenda,
    taxaCPF,
    adsFixo,
    roasAds,
    quantidade: safeQty,
  });
}
