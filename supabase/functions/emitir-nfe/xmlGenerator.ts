// =====================================================
// GERADOR DE XML NF-e (Deno/Edge Function)
// =====================================================

export interface DadosNFe {
  nota: any
  itens: any[]
  empresa: any
  config: any
}

export function gerarXMLNFe(dados: DadosNFe): string {
  const { nota, itens, empresa, config } = dados
  
  // Gerar chave de acesso (44 dígitos)
  const chaveAcesso = gerarChaveAcesso(nota, empresa)
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${chaveAcesso}">
    <ide>
      <cUF>${empresa.estado === 'SP' ? '35' : getCodigoUF(empresa.estado)}</cUF>
      <cNF>${String(nota.numero).padStart(8, '0')}</cNF>
      <natOp>${nota.natureza_operacao}</natOp>
      <mod>55</mod>
      <serie>${nota.serie}</serie>
      <nNF>${nota.numero}</nNF>
      <dhEmi>${new Date().toISOString()}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${empresa.codigo_municipio}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveAcesso.slice(-1)}</cDV>
      <tpAmb>${config.ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0</verProc>
    </ide>
    
    <emit>
      <CNPJ>${empresa.cnpj.replace(/\D/g, '')}</CNPJ>
      <xNome>${escaparXML(empresa.razao_social)}</xNome>
      <xFant>${escaparXML(empresa.nome_fantasia || empresa.razao_social)}</xFant>
      <enderEmit>
        <xLgr>${escaparXML(empresa.logradouro)}</xLgr>
        <nro>${empresa.numero}</nro>
        ${empresa.complemento ? `<xCpl>${escaparXML(empresa.complemento)}</xCpl>` : ''}
        <xBairro>${escaparXML(empresa.bairro)}</xBairro>
        <cMun>${empresa.codigo_municipio}</cMun>
        <xMun>${escaparXML(empresa.cidade)}</xMun>
        <UF>${empresa.estado}</UF>
        <CEP>${empresa.cep.replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
        ${empresa.telefone ? `<fone>${empresa.telefone.replace(/\D/g, '')}</fone>` : ''}
      </enderEmit>
      <IE>${empresa.inscricao_estadual}</IE>
      <CRT>${empresa.crt || '1'}</CRT>
    </emit>
    
    <dest>
      ${nota.destinatario_cpf_cnpj.length === 11 ? 
        `<CPF>${nota.destinatario_cpf_cnpj}</CPF>` : 
        `<CNPJ>${nota.destinatario_cpf_cnpj}</CNPJ>`
      }
      <xNome>${escaparXML(nota.destinatario_nome)}</xNome>
      <enderDest>
        <xLgr>${escaparXML(nota.destinatario_logradouro || 'RUA TESTE')}</xLgr>
        <nro>${nota.destinatario_numero || 'SN'}</nro>
        ${nota.destinatario_complemento ? `<xCpl>${escaparXML(nota.destinatario_complemento)}</xCpl>` : ''}
        <xBairro>${escaparXML(nota.destinatario_bairro || 'CENTRO')}</xBairro>
        <cMun>${nota.destinatario_codigo_municipio || '3550308'}</cMun>
        <xMun>${escaparXML(nota.destinatario_cidade || 'SAO PAULO')}</xMun>
        <UF>${nota.destinatario_uf || 'SP'}</UF>
        <CEP>${(nota.destinatario_cep || '01000000').replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderDest>
      <indIEDest>${nota.destinatario_indicador_ie === 'CONTRIBUINTE' ? '1' : '9'}</indIEDest>
    </dest>
    
    ${itens.map((item, index) => gerarXMLItem(item, index + 1)).join('\n    ')}
    
    <total>
      <ICMSTot>
        <vBC>${formatarValor(nota.valor_produtos || 0)}</vBC>
        <vICMS>${formatarValor(itens.reduce((sum, i) => sum + (i.icms_valor || 0), 0))}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${formatarValor(nota.valor_produtos || 0)}</vProd>
        <vFrete>${formatarValor(nota.valor_frete || 0)}</vFrete>
        <vSeg>${formatarValor(nota.valor_seguro || 0)}</vSeg>
        <vDesc>${formatarValor(nota.valor_desconto || 0)}</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${formatarValor(itens.reduce((sum, i) => sum + (i.pis_valor || 0), 0))}</vPIS>
        <vCOFINS>${formatarValor(itens.reduce((sum, i) => sum + (i.cofins_valor || 0), 0))}</vCOFINS>
        <vOutro>${formatarValor(nota.valor_outras_despesas || 0)}</vOutro>
        <vNF>${formatarValor(nota.valor_total || 0)}</vNF>
        <vTotTrib>${formatarValor(nota.valor_total_tributos || 0)}</vTotTrib>
      </ICMSTot>
    </total>
    
    <transp>
      <modFrete>${nota.modalidade_frete || '9'}</modFrete>
    </transp>
    
    ${nota.forma_pagamento ? gerarXMLPagamento(nota) : ''}
    
    ${nota.informacoes_complementares ? `
    <infAdic>
      <infCpl>${escaparXML(nota.informacoes_complementares)}</infCpl>
    </infAdic>
    ` : ''}
  </infNFe>
</NFe>`

  return xml
}

function gerarXMLItem(item: any, numeroItem: number): string {
  return `<det nItem="${numeroItem}">
      <prod>
        <cProd>${item.codigo_produto}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${escaparXML(item.descricao)}</xProd>
        <NCM>${item.ncm}</NCM>
        <CFOP>${item.cfop}</CFOP>
        <uCom>${item.unidade || 'UN'}</uCom>
        <qCom>${formatarQuantidade(item.quantidade)}</qCom>
        <vUnCom>${formatarValor(item.valor_unitario)}</vUnCom>
        <vProd>${formatarValor(item.valor_total)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>${item.unidade || 'UN'}</uTrib>
        <qTrib>${formatarQuantidade(item.quantidade)}</qTrib>
        <vUnTrib>${formatarValor(item.valor_unitario)}</vUnTrib>
        <indTot>1</indTot>
        ${item.valor_total_tributos ? `<vTotTrib>${formatarValor(item.valor_total_tributos)}</vTotTrib>` : ''}
      </prod>
      <imposto>
        <vTotTrib>${formatarValor(item.valor_total_tributos || 0)}</vTotTrib>
        <ICMS>
          <ICMS${item.icms_cst}>
            <orig>${item.icms_origem || '0'}</orig>
            <CST>${item.icms_cst || '00'}</CST>
            ${item.icms_base_calculo ? `<vBC>${formatarValor(item.icms_base_calculo)}</vBC>` : ''}
            ${item.icms_aliquota ? `<pICMS>${formatarValor(item.icms_aliquota)}</pICMS>` : ''}
            ${item.icms_valor ? `<vICMS>${formatarValor(item.icms_valor)}</vICMS>` : ''}
          </ICMS${item.icms_cst}>
        </ICMS>
        <PIS>
          <PIS${item.pis_cst === '01' || item.pis_cst === '02' ? 'Aliq' : 'OutOp'}>
            <CST>${item.pis_cst || '01'}</CST>
            ${item.pis_base_calculo ? `<vBC>${formatarValor(item.pis_base_calculo)}</vBC>` : ''}
            ${item.pis_aliquota ? `<pPIS>${formatarValor(item.pis_aliquota)}</pPIS>` : ''}
            ${item.pis_valor ? `<vPIS>${formatarValor(item.pis_valor)}</vPIS>` : ''}
          </PIS${item.pis_cst === '01' || item.pis_cst === '02' ? 'Aliq' : 'OutOp'}>
        </PIS>
        <COFINS>
          <COFINS${item.cofins_cst === '01' || item.cofins_cst === '02' ? 'Aliq' : 'OutOp'}>
            <CST>${item.cofins_cst || '01'}</CST>
            ${item.cofins_base_calculo ? `<vBC>${formatarValor(item.cofins_base_calculo)}</vBC>` : ''}
            ${item.cofins_aliquota ? `<pCOFINS>${formatarValor(item.cofins_aliquota)}</pCOFINS>` : ''}
            ${item.cofins_valor ? `<vCOFINS>${formatarValor(item.cofins_valor)}</vCOFINS>` : ''}
          </COFINS${item.cofins_cst === '01' || item.cofins_cst === '02' ? 'Aliq' : 'OutOp'}>
        </COFINS>
      </imposto>
    </det>`
}

function gerarXMLPagamento(nota: any): string {
  return `<pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>${getMeioPagamento(nota.forma_pagamento)}</tPag>
        <vPag>${formatarValor(nota.valor_pago || nota.valor_total)}</vPag>
      </detPag>
    </pag>`
}

function gerarChaveAcesso(nota: any, empresa: any): string {
  const uf = empresa.estado === 'SP' ? '35' : getCodigoUF(empresa.estado)
  const aamm = new Date().toISOString().slice(2, 7).replace('-', '')
  const cnpj = empresa.cnpj.replace(/\D/g, '').padStart(14, '0')
  const mod = '55'
  const serie = String(nota.serie).padStart(3, '0')
  const numero = String(nota.numero).padStart(9, '0')
  const tpEmis = '1'
  const codigo = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
  
  const chave = uf + aamm + cnpj + mod + serie + numero + tpEmis + codigo
  const dv = calcularDV(chave)
  
  return chave + dv
}

function calcularDV(chave: string): string {
  const pesos = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  
  for (let i = 0; i < chave.length; i++) {
    soma += parseInt(chave[i]) * pesos[i]
  }
  
  const resto = soma % 11
  return resto < 2 ? '0' : String(11 - resto)
}

function getCodigoUF(uf: string): string {
  const codigos: Record<string, string> = {
    'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
    'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
    'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
    'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
    'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
    'SE': '28', 'TO': '17'
  }
  return codigos[uf] || '35'
}

function getMeioPagamento(forma: string): string {
  const meios: Record<string, string> = {
    '0': '01',  // Dinheiro
    '17': '17', // PIX
    '3': '03',  // Cartão Crédito
    '4': '04',  // Cartão Débito
    '15': '15', // Boleto
  }
  return meios[forma] || '99'
}

function formatarValor(valor: number): string {
  return Number(valor || 0).toFixed(2)
}

function formatarQuantidade(qtd: number): string {
  return Number(qtd || 0).toFixed(4)
}

function escaparXML(texto: string): string {
  if (!texto) return ''
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
