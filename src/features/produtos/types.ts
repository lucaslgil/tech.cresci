// Types for Products - Brazilian ERP
export interface Categoria {
  id: string
  nome: string
  descricao: string | null
  created_at: string
  updated_at: string
}

export interface UnidadeMedida {
  id: string
  sigla: string
  descricao: string
  created_at: string
}

export interface Produto {
  id: string
  
  // DADOS GERAIS
  nome: string
  descricao: string | null
  codigo_interno: string
  codigo_barras: string | null
  categoria_id: string | null
  unidade_medida: string
  
  // DADOS FISCAIS
  ncm: string
  cest: string | null
  cfop_entrada: string | null
  cfop_saida: string | null
  origem_mercadoria: number
  
  // ICMS
  cst_icms: string | null
  csosn_icms: string | null
  aliquota_icms: number
  reducao_base_icms: number
  
  // PIS
  cst_pis: string | null
  aliquota_pis: number
  
  // COFINS
  cst_cofins: string | null
  aliquota_cofins: number
  
  // IPI
  cst_ipi: string | null
  aliquota_ipi: number
  codigo_enquadramento_ipi: string
  
  // SUBSTITUIÇÃO TRIBUTÁRIA
  tem_substituicao_tributaria: boolean
  mva_st: number
  aliquota_icms_st: number
  reducao_base_icms_st: number
  
  // OUTROS IMPOSTOS
  aliquota_aproximada_tributos: number
  informacoes_adicionais_fiscais: string | null
  
  // DADOS COMERCIAIS
  preco_custo: number
  preco_venda: number
  margem_lucro: number
  permite_desconto: boolean
  desconto_maximo: number
  
  // DADOS DE ESTOQUE
  estoque_atual: number
  estoque_minimo: number
  estoque_maximo: number
  localizacao: string | null
  controla_lote: boolean
  controla_serie: boolean
  controla_validade: boolean
  dias_validade: number | null
  
  // STATUS
  status: 'Ativo' | 'Inativo'
  observacoes: string | null
  
  // AUDITORIA
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  
  // RELACIONAMENTOS
  categorias_produtos?: Categoria
}

export interface ProdutoFormData {
  // DADOS GERAIS
  nome: string
  descricao: string
  codigo_interno: string
  codigo_barras: string
  categoria_id: string
  unidade_medida: string
  
  // DADOS FISCAIS
  ncm: string
  cest: string
  cfop_entrada: string
  cfop_saida: string
  origem_mercadoria: string
  
  // ICMS
  cst_icms: string
  csosn_icms: string
  aliquota_icms: string
  reducao_base_icms: string
  
  // PIS
  cst_pis: string
  aliquota_pis: string
  
  // COFINS
  cst_cofins: string
  aliquota_cofins: string
  
  // IPI
  cst_ipi: string
  aliquota_ipi: string
  codigo_enquadramento_ipi: string
  
  // SUBSTITUIÇÃO TRIBUTÁRIA
  tem_substituicao_tributaria: boolean
  mva_st: string
  aliquota_icms_st: string
  reducao_base_icms_st: string
  
  // OUTROS IMPOSTOS
  aliquota_aproximada_tributos: string
  informacoes_adicionais_fiscais: string
  
  // DADOS COMERCIAIS
  preco_custo: string
  preco_venda: string
  permite_desconto: boolean
  desconto_maximo: string
  
  // DADOS DE ESTOQUE
  estoque_atual: string
  estoque_minimo: string
  estoque_maximo: string
  localizacao: string
  controla_lote: boolean
  controla_serie: boolean
  controla_validade: boolean
  dias_validade: string
  
  // STATUS
  status: 'Ativo' | 'Inativo'
  observacoes: string
}

// Opções de origem de mercadoria (tabela 4.2.2 NF-e)
export const ORIGENS_MERCADORIA = [
  { value: 0, label: '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8' },
  { value: 1, label: '1 - Estrangeira - Importação direta, exceto a indicada no código 6' },
  { value: 2, label: '2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7' },
  { value: 3, label: '3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% e inferior ou igual a 70%' },
  { value: 4, label: '4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos' },
  { value: 5, label: '5 - Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%' },
  { value: 6, label: '6 - Estrangeira - Importação direta, sem similar nacional, constante em lista CAMEX' },
  { value: 7, label: '7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista CAMEX' },
  { value: 8, label: '8 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70%' }
]

// CST ICMS para Regime Normal
export const CST_ICMS_OPTIONS = [
  { value: '00', label: '00 - Tributada integralmente' },
  { value: '10', label: '10 - Tributada e com cobrança do ICMS por substituição tributária' },
  { value: '20', label: '20 - Com redução de base de cálculo' },
  { value: '30', label: '30 - Isenta ou não tributada e com cobrança do ICMS por substituição tributária' },
  { value: '40', label: '40 - Isenta' },
  { value: '41', label: '41 - Não tributada' },
  { value: '50', label: '50 - Suspensão' },
  { value: '51', label: '51 - Diferimento' },
  { value: '60', label: '60 - ICMS cobrado anteriormente por substituição tributária' },
  { value: '70', label: '70 - Com redução de base de cálculo e cobrança do ICMS por substituição tributária' },
  { value: '90', label: '90 - Outras' }
]

// CSOSN para Simples Nacional
export const CSOSN_ICMS_OPTIONS = [
  { value: '101', label: '101 - Tributada pelo Simples Nacional com permissão de crédito' },
  { value: '102', label: '102 - Tributada pelo Simples Nacional sem permissão de crédito' },
  { value: '103', label: '103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta' },
  { value: '201', label: '201 - Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por ST' },
  { value: '202', label: '202 - Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por ST' },
  { value: '203', label: '203 - Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por ST' },
  { value: '300', label: '300 - Imune' },
  { value: '400', label: '400 - Não tributada pelo Simples Nacional' },
  { value: '500', label: '500 - ICMS cobrado anteriormente por ST ou por antecipação' },
  { value: '900', label: '900 - Outros' }
]

// CST PIS/COFINS
export const CST_PIS_COFINS_OPTIONS = [
  { value: '01', label: '01 - Operação Tributável com Alíquota Básica' },
  { value: '02', label: '02 - Operação Tributável com Alíquota Diferenciada' },
  { value: '03', label: '03 - Operação Tributável com Alíquota por Unidade de Medida de Produto' },
  { value: '04', label: '04 - Operação Tributável Monofásica - Revenda a Alíquota Zero' },
  { value: '05', label: '05 - Operação Tributável por Substituição Tributária' },
  { value: '06', label: '06 - Operação Tributável a Alíquota Zero' },
  { value: '07', label: '07 - Operação Isenta da Contribuição' },
  { value: '08', label: '08 - Operação sem Incidência da Contribuição' },
  { value: '09', label: '09 - Operação com Suspensão da Contribuição' },
  { value: '49', label: '49 - Outras Operações de Saída' },
  { value: '50', label: '50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { value: '51', label: '51 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno' },
  { value: '52', label: '52 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita de Exportação' },
  { value: '53', label: '53 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno' },
  { value: '54', label: '54 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas no Mercado Interno e de Exportação' },
  { value: '55', label: '55 - Operação com Direito a Crédito - Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação' },
  { value: '56', label: '56 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação' },
  { value: '60', label: '60 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { value: '61', label: '61 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno' },
  { value: '62', label: '62 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação' },
  { value: '63', label: '63 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno' },
  { value: '64', label: '64 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação' },
  { value: '65', label: '65 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação' },
  { value: '66', label: '66 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação' },
  { value: '67', label: '67 - Crédito Presumido - Outras Operações' },
  { value: '70', label: '70 - Operação de Aquisição sem Direito a Crédito' },
  { value: '71', label: '71 - Operação de Aquisição com Isenção' },
  { value: '72', label: '72 - Operação de Aquisição com Suspensão' },
  { value: '73', label: '73 - Operação de Aquisição a Alíquota Zero' },
  { value: '74', label: '74 - Operação de Aquisição sem Incidência da Contribuição' },
  { value: '75', label: '75 - Operação de Aquisição por Substituição Tributária' },
  { value: '98', label: '98 - Outras Operações de Entrada' },
  { value: '99', label: '99 - Outras Operações' }
]

// CST IPI
export const CST_IPI_OPTIONS = [
  { value: '00', label: '00 - Entrada com Recuperação de Crédito' },
  { value: '01', label: '01 - Entrada Tributada com Alíquota Zero' },
  { value: '02', label: '02 - Entrada Isenta' },
  { value: '03', label: '03 - Entrada Não-Tributada' },
  { value: '04', label: '04 - Entrada Imune' },
  { value: '05', label: '05 - Entrada com Suspensão' },
  { value: '49', label: '49 - Outras Entradas' },
  { value: '50', label: '50 - Saída Tributada' },
  { value: '51', label: '51 - Saída Tributada com Alíquota Zero' },
  { value: '52', label: '52 - Saída Isenta' },
  { value: '53', label: '53 - Saída Não-Tributada' },
  { value: '54', label: '54 - Saída Imune' },
  { value: '55', label: '55 - Saída com Suspensão' },
  { value: '99', label: '99 - Outras Saídas' }
]

// CFOP mais comuns
export const CFOP_OPTIONS = [
  // Entradas
  { value: '1101', label: '1101 - Compra para industrialização' },
  { value: '1102', label: '1102 - Compra para comercialização' },
  { value: '1111', label: '1111 - Compra para industrialização de mercadoria recebida anteriormente em consignação industrial' },
  { value: '1113', label: '1113 - Compra para comercialização, de mercadoria recebida anteriormente em consignação mercantil' },
  { value: '1116', label: '1116 - Compra para industrialização originada de encomenda para recebimento futuro' },
  { value: '1117', label: '1117 - Compra para comercialização originada de encomenda para recebimento futuro' },
  { value: '1120', label: '1120 - Compra para industrialização, em venda à ordem, já recebida do vendedor remetente' },
  { value: '1121', label: '1121 - Compra para comercialização, em venda à ordem, já recebida do vendedor remetente' },
  { value: '1122', label: '1122 - Compra para industrialização em que a mercadoria foi remetida pelo fornecedor ao industrializador sem transitar pelo estabelecimento adquirente' },
  { value: '1124', label: '1124 - Industrialização efetuada por outra empresa' },
  { value: '1125', label: '1125 - Industrialização efetuada por outra empresa quando a mercadoria remetida para utilização no processo de industrialização não transitou pelo estabelecimento adquirente da mercadoria' },
  { value: '1126', label: '1126 - Compra para utilização na prestação de serviço' },
  { value: '1131', label: '1131 - Entrada de mercadoria com previsão de posterior ajuste ou fixação de preço, decorrente de operação de ato cooperativo' },
  { value: '1132', label: '1132 - Fixação de preço de produção do estabelecimento produtor, inclusive quando remetida anteriormente com previsão de posterior ajuste ou fixação de preço, em ato cooperativo, para comercialização' },
  { value: '1135', label: '1135 - Fixação de preço de produção do estabelecimento produtor, inclusive quando remetida anteriormente com previsão de posterior ajuste ou fixação de preço, de ato cooperativo, para industrialização' },
  { value: '1401', label: '1401 - Compra para industrialização em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '1403', label: '1403 - Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '1406', label: '1406 - Compra de bem para o ativo imobilizado' },
  { value: '1407', label: '1407 - Compra de mercadoria para uso ou consumo' },
  { value: '1408', label: '1408 - Transferência para industrialização' },
  { value: '1409', label: '1409 - Transferência para comercialização' },
  { value: '1411', label: '1411 - Devolução de venda de produção do estabelecimento' },
  { value: '1414', label: '1414 - Retorno de produção do estabelecimento, remetida para venda fora do estabelecimento' },
  { value: '1415', label: '1415 - Retorno de mercadoria remetida para venda fora do estabelecimento' },
  { value: '1451', label: '1451 - Entrada de animal - Sistema de Integração e Parceria Rural' },
  { value: '1452', label: '1452 - Entrada de insumo - Sistema de Integração e Parceria Rural' },
  { value: '1501', label: '1501 - Entrada de mercadoria recebida com fim específico de exportação' },
  { value: '1503', label: '1503 - Entrada decorrente de devolução de produto remetido com fim específico de exportação, de produção do estabelecimento' },
  { value: '1504', label: '1504 - Entrada decorrente de devolução de mercadoria remetida com fim específico de exportação, adquirida ou recebida de terceiros' },
  { value: '1551', label: '1551 - Compra de bem para o ativo imobilizado' },
  { value: '1552', label: '1552 - Transferência de bem do ativo imobilizado' },
  { value: '1553', label: '1553 - Devolução de venda de bem do ativo imobilizado' },
  { value: '1554', label: '1554 - Retorno de bem do ativo imobilizado remetido para uso fora do estabelecimento' },
  { value: '1555', label: '1555 - Entrada de bem do ativo imobilizado de terceiro, remetido para uso no estabelecimento' },
  { value: '1556', label: '1556 - Compra de material para uso ou consumo' },
  { value: '1557', label: '1557 - Transferência de material para uso ou consumo' },
  { value: '1601', label: '1601 - Recebimento, por transferência, de crédito de ICMS' },
  { value: '1602', label: '1602 - Recebimento, por transferência, de saldo credor de ICMS de outro estabelecimento da mesma empresa, para compensação de saldo devedor de ICMS' },
  { value: '1603', label: '1603 - Ressarcimento de ICMS retido por substituição tributária' },
  { value: '1604', label: '1604 - Lançamento do crédito relativo à compra de bem para o ativo imobilizado' },
  { value: '1605', label: '1605 - Recebimento, por transferência, de saldo devedor de ICMS de outro estabelecimento da mesma empresa' },
  { value: '1651', label: '1651 - Compra de combustível ou lubrificante para industrialização subsequente' },
  { value: '1652', label: '1652 - Compra de combustível ou lubrificante para comercialização' },
  { value: '1653', label: '1653 - Compra de combustível ou lubrificante por consumidor ou usuário final' },
  { value: '1658', label: '1658 - Transferência de combustível ou lubrificante para industrialização' },
  { value: '1659', label: '1659 - Transferência de combustível ou lubrificante para comercialização' },
  { value: '1660', label: '1660 - Devolução de venda de combustível ou lubrificante destinado à industrialização subsequente' },
  { value: '1661', label: '1661 - Devolução de venda de combustível ou lubrificante destinado à comercialização' },
  { value: '1662', label: '1662 - Devolução de venda de combustível ou lubrificante destinado a consumidor ou usuário final' },
  { value: '1663', label: '1663 - Entrada de combustível ou lubrificante para armazenagem' },
  { value: '1664', label: '1664 - Retorno de combustível ou lubrificante remetido para armazenagem' },
  { value: '1901', label: '1901 - Entrada para industrialização por encomenda' },
  { value: '1902', label: '1902 - Retorno de mercadoria remetida para industrialização por encomenda' },
  { value: '1903', label: '1903 - Entrada de mercadoria remetida para industrialização e não aplicada no referido processo' },
  { value: '1904', label: '1904 - Retorno de remessa para venda fora do estabelecimento' },
  { value: '1905', label: '1905 - Entrada de mercadoria recebida para depósito em depósito fechado ou armazém geral' },
  { value: '1906', label: '1906 - Retorno de mercadoria remetida para depósito fechado ou armazém geral' },
  { value: '1907', label: '1907 - Retorno simbólico de mercadoria remetida para depósito fechado ou armazém geral' },
  { value: '1908', label: '1908 - Entrada de bem por conta de contrato de comodato' },
  { value: '1909', label: '1909 - Retorno de bem remetido por conta de contrato de comodato' },
  { value: '1910', label: '1910 - Entrada de bonificação, doação ou brinde' },
  { value: '1911', label: '1911 - Entrada de amostra grátis' },
  { value: '1912', label: '1912 - Entrada de mercadoria ou bem recebido para demonstração' },
  { value: '1913', label: '1913 - Retorno de mercadoria ou bem remetido para demonstração' },
  { value: '1914', label: '1914 - Retorno de mercadoria ou bem remetido para exposição ou feira' },
  { value: '1915', label: '1915 - Entrada de mercadoria ou bem recebido para conserto ou reparo' },
  { value: '1916', label: '1916 - Retorno de mercadoria ou bem remetido para conserto ou reparo' },
  { value: '1917', label: '1917 - Entrada de mercadoria recebida em consignação mercantil ou industrial' },
  { value: '1918', label: '1918 - Devolução de mercadoria remetida em consignação mercantil ou industrial' },
  { value: '1919', label: '1919 - Devolução simbólica de mercadoria vendida ou utilizada em processo industrial, remetida anteriormente em consignação mercantil ou industrial' },
  { value: '1920', label: '1920 - Entrada de vasilhame ou sacaria' },
  { value: '1921', label: '1921 - Retorno de vasilhame ou sacaria' },
  { value: '1922', label: '1922 - Lançamento efetuado a título de simples faturamento decorrente de compra para recebimento futuro' },
  { value: '1923', label: '1923 - Entrada de mercadoria recebida do vendedor remetente, em venda à ordem' },
  { value: '1924', label: '1924 - Entrada para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente' },
  { value: '1925', label: '1925 - Retorno de mercadoria remetida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente' },
  { value: '1926', label: '1926 - Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desagregação' },
  { value: '1931', label: '1931 - Lançamento efetuado pelo tomador do serviço de transporte quando a responsabilidade de retenção do imposto for atribuída ao remetente ou alienante da mercadoria, pelo serviço de transporte realizado' },
  { value: '1932', label: '1932 - Aquisição de serviço de transporte iniciado em Unidade da Federação diversa daquela onde inscrito o prestador' },
  { value: '1933', label: '1933 - Aquisição de serviço tributado pelo ISSQN' },
  { value: '1934', label: '1934 - Entrada simbólica de mercadoria recebida para depósito fechado ou armazém geral' },
  { value: '1949', label: '1949 - Outra entrada de mercadoria ou prestação de serviço não especificado' },
  
  // Saídas
  { value: '5101', label: '5101 - Venda de produção do estabelecimento' },
  { value: '5102', label: '5102 - Venda de mercadoria adquirida ou recebida de terceiros' },
  { value: '5103', label: '5103 - Venda de produção do estabelecimento, efetuada fora do estabelecimento' },
  { value: '5104', label: '5104 - Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento' },
  { value: '5105', label: '5105 - Venda de produção do estabelecimento que não deva por ele transitar' },
  { value: '5106', label: '5106 - Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar' },
  { value: '5109', label: '5109 - Venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio' },
  { value: '5110', label: '5110 - Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio' },
  { value: '5111', label: '5111 - Venda de produção do estabelecimento remetida anteriormente em consignação industrial' },
  { value: '5112', label: '5112 - Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação industrial' },
  { value: '5113', label: '5113 - Venda de produção do estabelecimento remetida anteriormente em consignação mercantil' },
  { value: '5114', label: '5114 - Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação mercantil' },
  { value: '5115', label: '5115 - Venda de mercadoria adquirida ou recebida de terceiros, recebida anteriormente em consignação mercantil' },
  { value: '5116', label: '5116 - Venda de produção do estabelecimento originada de encomenda para entrega futura' },
  { value: '5117', label: '5117 - Venda de mercadoria adquirida ou recebida de terceiros, originada de encomenda para entrega futura' },
  { value: '5118', label: '5118 - Venda de produção do estabelecimento entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem' },
  { value: '5119', label: '5119 - Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem' },
  { value: '5120', label: '5120 - Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário pelo vendedor remetente, em venda à ordem' },
  { value: '5122', label: '5122 - Venda de produção do estabelecimento remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente' },
  { value: '5123', label: '5123 - Venda de mercadoria adquirida ou recebida de terceiros remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente' },
  { value: '5124', label: '5124 - Industrialização efetuada para outra empresa' },
  { value: '5125', label: '5125 - Industrialização efetuada para outra empresa quando a mercadoria recebida para utilização no processo de industrialização não transitar pelo estabelecimento adquirente da mercadoria' },
  { value: '5131', label: '5131 - Remessa de produção de estabelecimento com previsão de posterior ajuste ou fixação de preço' },
  { value: '5132', label: '5132 - Fixação de preço de produção do estabelecimento produtor' },
  { value: '5151', label: '5151 - Transferência de produção do estabelecimento' },
  { value: '5152', label: '5152 - Transferência de mercadoria adquirida ou recebida de terceiros' },
  { value: '5153', label: '5153 - Transferência de energia elétrica' },
  { value: '5155', label: '5155 - Transferência de produção do estabelecimento, que não deva por ele transitar' },
  { value: '5156', label: '5156 - Transferência de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar' },
  { value: '5159', label: '5159 - Fornecimento de produção do estabelecimento de ato cooperativo' },
  { value: '5160', label: '5160 - Fornecimento de mercadoria adquirida ou recebida de terceiros de ato cooperativo' },
  { value: '5201', label: '5201 - Devolução de compra para industrialização' },
  { value: '5202', label: '5202 - Devolução de compra para comercialização' },
  { value: '5205', label: '5205 - Anulação de valor relativo à aquisição de serviço de comunicação' },
  { value: '5206', label: '5206 - Anulação de valor relativo a aquisição de serviço de transporte' },
  { value: '5207', label: '5207 - Anulação de valor relativo à compra de energia elétrica' },
  { value: '5208', label: '5208 - Devolução de mercadoria recebida em transferência para industrialização' },
  { value: '5209', label: '5209 - Devolução de mercadoria recebida em transferência para comercialização' },
  { value: '5210', label: '5210 - Devolução de compra para utilização na prestação de serviço' },
  { value: '5251', label: '5251 - Venda de energia elétrica para distribuição ou comercialização' },
  { value: '5252', label: '5252 - Venda de energia elétrica para estabelecimento industrial' },
  { value: '5253', label: '5253 - Venda de energia elétrica para estabelecimento comercial' },
  { value: '5254', label: '5254 - Venda de energia elétrica para estabelecimento prestador de serviço de transporte' },
  { value: '5255', label: '5255 - Venda de energia elétrica para estabelecimento prestador de serviço de comunicação' },
  { value: '5256', label: '5256 - Venda de energia elétrica para estabelecimento de produtor rural' },
  { value: '5257', label: '5257 - Venda de energia elétrica para consumo por demanda contratada' },
  { value: '5258', label: '5258 - Venda de energia elétrica a não contribuinte' },
  { value: '5401', label: '5401 - Venda de produção do estabelecimento em operação com produto sujeito ao regime de substituição tributária, na condição de contribuinte substituto' },
  { value: '5402', label: '5402 - Venda de produção do estabelecimento de produto sujeito ao regime de substituição tributária, em operação entre contribuintes substitutos do mesmo produto' },
  { value: '5403', label: '5403 - Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto' },
  { value: '5405', label: '5405 - Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituído' },
  { value: '5408', label: '5408 - Transferência de produção do estabelecimento em operação com produto sujeito ao regime de substituição tributária' },
  { value: '5409', label: '5409 - Transferência de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '5410', label: '5410 - Devolução de compra para industrialização em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '5411', label: '5411 - Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '5412', label: '5412 - Devolução de bem do ativo imobilizado, em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '5413', label: '5413 - Devolução de mercadoria destinada ao uso ou consumo, em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '5414', label: '5414 - Remessa de produção do estabelecimento para venda fora do estabelecimento em operação com produto sujeito ao regime de substituição tributária' },
  { value: '5415', label: '5415 - Remessa de mercadoria adquirida ou recebida de terceiros para venda fora do estabelecimento, em operação com mercadoria sujeita ao regime de substituição tributária' },
  { value: '5451', label: '5451 - Remessa de animal - Sistema de Integração e Parceria Rural' },
  { value: '5452', label: '5452 - Remessa de insumo - Sistema de Integração e Parceria Rural' },
  { value: '5501', label: '5501 - Remessa de produção do estabelecimento, com fim específico de exportação' },
  { value: '5502', label: '5502 - Remessa de mercadoria adquirida ou recebida de terceiros, com fim específico de exportação' },
  { value: '5503', label: '5503 - Devolução de mercadoria recebida com fim específico de exportação' },
  { value: '5504', label: '5504 - Remessa de mercadorias para formação de lote de exportação, de produtos industrializados ou produzidos pelo próprio estabelecimento' },
  { value: '5505', label: '5505 - Remessa de mercadorias, adquiridas ou recebidas de terceiros, para formação de lote de exportação' },
  { value: '5551', label: '5551 - Venda de bem do ativo imobilizado' },
  { value: '5552', label: '5552 - Transferência de bem do ativo imobilizado' },
  { value: '5553', label: '5553 - Devolução de compra de bem para o ativo imobilizado' },
  { value: '5554', label: '5554 - Remessa de bem do ativo imobilizado para uso fora do estabelecimento' },
  { value: '5555', label: '5555 - Devolução de bem do ativo imobilizado de terceiro, recebido para uso no estabelecimento' },
  { value: '5556', label: '5556 - Devolução de compra de material de uso ou consumo' },
  { value: '5557', label: '5557 - Transferência de material de uso ou consumo' },
  { value: '5601', label: '5601 - Transferência de crédito de ICMS acumulado' },
  { value: '5602', label: '5602 - Transferência de saldo credor de ICMS para outro estabelecimento da mesma empresa, destinado à compensação de saldo devedor de ICMS' },
  { value: '5603', label: '5603 - Ressarcimento de ICMS retido por substituição tributária' },
  { value: '5605', label: '5605 - Transferência de saldo devedor de ICMS de outro estabelecimento da mesma empresa' },
  { value: '5606', label: '5606 - Utilização de saldo credor de ICMS para extinção por compensação de débitos fiscais' },
  { value: '5651', label: '5651 - Venda de combustível ou lubrificante de produção do estabelecimento destinado à industrialização subsequente' },
  { value: '5652', label: '5652 - Venda de combustível ou lubrificante de produção do estabelecimento destinado à comercialização' },
  { value: '5653', label: '5653 - Venda de combustível ou lubrificante de produção do estabelecimento destinado a consumidor ou usuário final' },
  { value: '5654', label: '5654 - Venda de combustível ou lubrificante de produção do estabelecimento destinado a não contribuinte' },
  { value: '5655', label: '5655 - Venda de combustível ou lubrificante adquirido ou recebido de terceiros destinado à industrialização subsequente' },
  { value: '5656', label: '5656 - Venda de combustível ou lubrificante adquirido ou recebido de terceiros destinado à comercialização' },
  { value: '5657', label: '5657 - Venda de combustível ou lubrificante adquirido ou recebido de terceiros destinado a consumidor ou usuário final' },
  { value: '5658', label: '5658 - Transferência de combustível ou lubrificante de produção do estabelecimento' },
  { value: '5659', label: '5659 - Transferência de combustível ou lubrificante adquirido ou recebido de terceiro' },
  { value: '5660', label: '5660 - Devolução de compra de combustível ou lubrificante adquirido para industrialização subsequente' },
  { value: '5661', label: '5661 - Devolução de compra de combustível ou lubrificante adquirido para comercialização' },
  { value: '5662', label: '5662 - Devolução de compra de combustível ou lubrificante adquirido por consumidor ou usuário final' },
  { value: '5663', label: '5663 - Remessa para armazenagem de combustível ou lubrificante' },
  { value: '5664', label: '5664 - Retorno de combustível ou lubrificante recebido para armazenagem' },
  { value: '5665', label: '5665 - Retorno simbólico de combustível ou lubrificante recebido para armazenagem' },
  { value: '5666', label: '5666 - Remessa por conta e ordem de terceiros de combustível ou lubrificante recebido para armazenagem' },
  { value: '5667', label: '5667 - Venda de combustível ou lubrificante a consumidor ou usuário final estabelecido em outra unidade da Federação diferente da que ocorrer o consumo' },
  { value: '5901', label: '5901 - Remessa para industrialização por encomenda' },
  { value: '5902', label: '5902 - Retorno de mercadoria utilizada na industrialização por encomenda' },
  { value: '5903', label: '5903 - Retorno de mercadoria recebida para industrialização e não aplicada no referido processo' },
  { value: '5904', label: '5904 - Remessa para venda fora do estabelecimento' },
  { value: '5905', label: '5905 - Remessa para depósito fechado ou armazém geral' },
  { value: '5906', label: '5906 - Retorno de mercadoria depositada em depósito fechado ou armazém geral' },
  { value: '5907', label: '5907 - Retorno simbólico de mercadoria depositada em depósito fechado ou armazém geral' },
  { value: '5908', label: '5908 - Remessa de bem por conta de contrato de comodato' },
  { value: '5909', label: '5909 - Retorno de bem recebido por conta de contrato de comodato' },
  { value: '5910', label: '5910 - Remessa em bonificação, doação ou brinde' },
  { value: '5911', label: '5911 - Remessa de amostra grátis' },
  { value: '5912', label: '5912 - Remessa de mercadoria ou bem para demonstração' },
  { value: '5913', label: '5913 - Retorno de mercadoria ou bem recebido para demonstração' },
  { value: '5914', label: '5914 - Remessa de mercadoria ou bem para exposição ou feira' },
  { value: '5915', label: '5915 - Remessa de mercadoria ou bem para conserto ou reparo' },
  { value: '5916', label: '5916 - Retorno de mercadoria ou bem recebido para conserto ou reparo' },
  { value: '5917', label: '5917 - Remessa de mercadoria em consignação mercantil ou industrial' },
  { value: '5918', label: '5918 - Devolução de mercadoria recebida em consignação mercantil ou industrial' },
  { value: '5919', label: '5919 - Devolução simbólica de mercadoria vendida ou utilizada em processo industrial, recebida anteriormente em consignação mercantil ou industrial' },
  { value: '5920', label: '5920 - Remessa de vasilhame ou sacaria' },
  { value: '5921', label: '5921 - Devolução de vasilhame ou sacaria' },
  { value: '5922', label: '5922 - Lançamento efetuado a título de simples faturamento decorrente de venda para entrega futura' },
  { value: '5923', label: '5923 - Remessa de mercadoria por conta e ordem de terceiros, em venda à ordem ou em operações com armazém geral ou depósito fechado' },
  { value: '5924', label: '5924 - Remessa para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente' },
  { value: '5925', label: '5925 - Retorno de mercadoria recebida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente' },
  { value: '5926', label: '5926 - Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desagregação' },
  { value: '5927', label: '5927 - Lançamento efetuado a título de baixa de estoque decorrente de perda, roubo ou deterioração' },
  { value: '5928', label: '5928 - Lançamento efetuado a título de baixa de estoque decorrente do encerramento da atividade da empresa' },
  { value: '5929', label: '5929 - Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF' },
  { value: '5931', label: '5931 - Lançamento efetuado em decorrência da responsabilidade de retenção do imposto por substituição tributária, atribuída ao remetente ou alienante da mercadoria, pelo serviço de transporte realizado por transportador autônomo ou por transportador não inscrito na unidade da Federação onde iniciado o serviço' },
  { value: '5932', label: '5932 - Prestação de serviço de transporte iniciada em unidade da Federação diversa daquela onde inscrito o prestador' },
  { value: '5933', label: '5933 - Prestação de serviço tributado pelo ISSQN' },
  { value: '5934', label: '5934 - Remessa simbólica de mercadoria depositada em armazém geral ou depósito fechado' },
  { value: '5949', label: '5949 - Outra saída de mercadoria ou prestação de serviço não especificado' }
]
