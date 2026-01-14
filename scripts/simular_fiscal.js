// Simulação do motor fiscal (local, sem Supabase)

function aplicarMotorFiscalNoItemSimulado(item, contexto, regra = null, icmsst = null) {
  // regra e icmsst são fornecidos como mocks
  regra = regra || {
    origem_mercadoria: '0',
    cst_icms: '00',
    csosn_icms: null,
    aliquota_icms: 18.0,
    reducao_bc_icms: 0,
    aliquota_pis: 1.65,
    aliquota_cofins: 7.6,
    aliquota_ipi: 0
  }

  icmsst = icmsst || {
    mva: 40.0,
    aliquota_interna: 18.0,
    aliquota_fcp: 0
  }

  const aliquota_icms = regra.aliquota_icms || 0
  const cst_icms = regra.cst_icms
  const aliquota_pis = regra.aliquota_pis || 0
  const aliquota_cofins = regra.aliquota_cofins || 0
  const aliquota_ipi = regra.aliquota_ipi || 0

  const valor_bruto = (item.quantidade_comercial || 0) * (item.valor_unitario_comercial || 0)
  const valor_desconto = item.valor_desconto || 0
  const valor_total = valor_bruto - valor_desconto

  const base_calculo_icms = valor_total
  const valor_icms = +(base_calculo_icms * (aliquota_icms / 100))

  // ICMS-ST
  let mva = Number(icmsst.mva || 0)
  let aliquota_interna = Number(icmsst.aliquota_interna || 0)
  let aliquota_fcp = Number(icmsst.aliquota_fcp || 0)
  let base_calculo_icms_st = 0
  let valor_icms_st = 0

  if (icmsst) {
    const valor_ipi = valor_total * (aliquota_ipi / 100)
    base_calculo_icms_st = +((valor_total + valor_ipi) * (1 + (mva / 100)))
    valor_icms_st = +(base_calculo_icms_st * (aliquota_interna / 100))
    valor_icms_st = Math.max(0, valor_icms_st - valor_icms)
  }

  const base_calculo_pis = valor_total
  const valor_pis = +(base_calculo_pis * (aliquota_pis / 100))
  const base_calculo_cofins = valor_total
  const valor_cofins = +(base_calculo_cofins * (aliquota_cofins / 100))
  const base_calculo_ipi = valor_total
  const valor_ipi = +(base_calculo_ipi * (aliquota_ipi / 100))

  return {
    descricao: item.descricao,
    quantidade: item.quantidade_comercial,
    valor_unitario: item.valor_unitario_comercial,
    valor_total,
    base_calculo_icms,
    aliquota_icms,
    valor_icms,
    base_calculo_icms_st,
    aliquota_icms_st: regra.aliquota_icms_st || aliquota_interna,
    valor_icms_st,
    base_calculo_pis,
    aliquota_pis,
    valor_pis,
    base_calculo_cofins,
    aliquota_cofins,
    valor_cofins,
    base_calculo_ipi,
    aliquota_ipi,
    valor_ipi
  }
}

// Dados de exemplo
const contexto = {
  empresaId: 1,
  tipoOperacao: 'VENDA',
  ufOrigem: 'SP',
  ufDestino: 'RJ'
}

const itemExemplo = {
  codigo_produto: 'PROD-001',
  descricao: 'Produto Teste',
  ncm: '12345678',
  cfop: '5102',
  unidade_comercial: 'UN',
  quantidade_comercial: 10,
  valor_unitario_comercial: 100.00,
  valor_desconto: 50.00
}

// Regra mock (ex.: por NCM)
const regraMock = {
  origem_mercadoria: '0',
  cst_icms: '00',
  csosn_icms: null,
  aliquota_icms: 12.0,
  reducao_bc_icms: 0,
  aliquota_pis: 1.65,
  aliquota_cofins: 7.6,
  aliquota_ipi: 5.0,
  aliquota_icms_st: 18.0,
  reducao_bc_st: 0
}

// ICMS-ST mock
const icmsstMock = {
  mva: 40.0,
  aliquota_interna: 18.0,
  aliquota_fcp: 0
}

const resultado = aplicarMotorFiscalNoItemSimulado(itemExemplo, contexto, regraMock, icmsstMock)

console.log('Simulação do motor fiscal para item:')
console.table(resultado)

// Simular criação de nota com 2 itens
const item2 = { ...itemExemplo, codigo_produto: 'PROD-002', quantidade_comercial: 2, valor_unitario_comercial: 250 }
const res1 = aplicarMotorFiscalNoItemSimulado(itemExemplo, contexto, regraMock, icmsstMock)
const res2 = aplicarMotorFiscalNoItemSimulado(item2, contexto, regraMock, icmsstMock)

console.log('\nResumo Nota Fiscal (2 itens):')
console.log('Total produtos:', (res1.valor_total + res2.valor_total).toFixed(2))
console.log('Total ICMS:', (res1.valor_icms + res2.valor_icms).toFixed(2))
console.log('Total ICMS-ST:', (res1.valor_icms_st + res2.valor_icms_st).toFixed(2))
console.log('Total PIS:', (res1.valor_pis + res2.valor_pis).toFixed(2))
console.log('Total COFINS:', (res1.valor_cofins + res2.valor_cofins).toFixed(2))
console.log('Total IPI:', (res1.valor_ipi + res2.valor_ipi).toFixed(2))
