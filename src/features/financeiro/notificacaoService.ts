/**
 * SERVIÇO DE GERAÇÃO DE PDF - NOTIFICAÇÃO EXTRAJUDICIAL
 * Gera documento PDF conforme template oficial CRESCI E PERDI
 */

import jsPDF from 'jspdf'

export type TipoNotificacao = 'fundo_propaganda' | 'royalties'

export interface ItemDebitoNotificacao {
  dataVencimento?: string
  referencia?: string
  valorOriginal: number
  multaPercentual: number
  valorMulta: number
  jurosPercentual: number
  valorJuros: number
  subtotal: number
}

export interface DadosNotificacao {
  // Dados do franqueado (cliente)
  nomeCompleto: string
  cpf: string
  rg?: string
  endereco?: string
  email?: string

  // Qualificação pessoal para o documento
  nacionalidade?: string    // ex.: "brasileiro(a)"
  profissao?: string        // ex.: "empresário(a)"
  estadoCivilDoc?: string   // ex.: "casado(a)"

  // Dados do débito
  territorioUnidade: string
  mesCompetencia: string
  dataVencimento?: string   // ex.: "31/01/2025"
  referencia?: string       // ex.: "TAXA DE PROPAGANDA Janeiro/2025"
  valorOriginal: number
  multaPercentual: number
  valorMulta: number
  jurosPercentual: number
  valorJuros: number
  valorTotal: number

  // Tipo do documento
  tipo: TipoNotificacao

  // Data de emissão
  dataEmissao?: string
  // Múltiplos itens de débito (opcional)
  itensDebito?: ItemDebitoNotificacao[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Imprime texto com quebra de linha e retorna o novo Y */
function addText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  bold = false,
  fontSize = 10
): number {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(fontSize)
  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

interface TextSegment {
  text: string
  bold?: boolean
  underline?: boolean
}

/**
 * Imprime um parágrafo com trechos de estilo diferente (negrito / sublinhado),
 * fazendo quebra de linha automática palavra-a-palavra.
 * Retorna o Y após o parágrafo.
 */
function addMixedParagraph(
  doc: jsPDF,
  segments: TextSegment[],
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  fontSize = 10
): number {
  let cx = x
  let cy = startY

  for (const seg of segments) {
    doc.setFont('helvetica', seg.bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)

    // Dividir o segmento em tokens (palavras + espaços)
    const tokens = seg.text.split(/(\s+)/)
    for (const token of tokens) {
      if (token === '') continue
      const isSpace = /^\s+$/.test(token)
      const tokenWidth = doc.getTextWidth(token)

      // Quebra de linha se ultrapassar a margem direita (exceto início da linha)
      if (!isSpace && cx + tokenWidth > x + maxWidth + 0.5 && cx > x) {
        cx = x
        cy += lineHeight
        doc.setFont('helvetica', seg.bold ? 'bold' : 'normal')
        doc.setFontSize(fontSize)
      }

      if (!isSpace) {
        doc.text(token, cx, cy)
        if (seg.underline) {
          const tw = doc.getTextWidth(token)
          doc.setLineWidth(0.2)
          doc.line(cx, cy + 0.7, cx + tw, cy + 0.7)
        }
      }
      cx += tokenWidth
    }
  }

  return cy + lineHeight
}

/** Desenha texto centralizado com sublinhado */
function addCenteredUnderlined(
  doc: jsPDF,
  text: string,
  y: number,
  pageWidth: number,
  fontSize = 10,
  bold = true
): void {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(fontSize)
  const tw = doc.getTextWidth(text)
  const xStart = (pageWidth - tw) / 2
  doc.text(text, pageWidth / 2, y, { align: 'center' })
  doc.setLineWidth(0.2)
  doc.line(xStart, y + 0.7, xStart + tw, y + 0.7)
}

/** Desenha a tabela de débito com 6 colunas */
function drawDebtTable(
  doc: jsPDF,
  marginLeft: number,
  y: number,
  contentWidth: number,
  rows: Array<{
    dataVencimento: string
    valorOriginal: string
    multa: string
    juros: string
    valorAtual: string
    referencia: string
  }>,
  totalLabel?: string
): number {
  const headers = ['Data Vencimento', 'Valor Original', 'Multa', 'Juros', 'Valor Atual', 'Referência']
  // Larguras das colunas (total = contentWidth ~160mm)
  const colWidths = [28, 27, 22, 22, 27, contentWidth - 28 - 27 - 22 - 22 - 27]
  const rowHeight = 7
  const headerHeight = 8

  // Calcular posições X de cada coluna
  const colX: number[] = []
  let cx = marginLeft
  for (const w of colWidths) {
    colX.push(cx)
    cx += w
  }

  // Cabeçalho com fundo escuro
  doc.setFillColor(57, 67, 83) // #394353
  doc.rect(marginLeft, y, contentWidth, headerHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  headers.forEach((h, i) => {
    const padding = 2
    doc.text(h, colX[i] + padding, y + headerHeight - 2)
  })

  // Linhas de dados
  let currentY = y + headerHeight
  rows.forEach((row, ri) => {
    if (rows.length > 1 && ri % 2 === 1) {
      doc.setFillColor(248, 248, 248)
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F')
    }
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const dataY = currentY + rowHeight - 2
    const rowValues = [row.dataVencimento, row.valorOriginal, row.multa, row.juros, row.valorAtual, row.referencia]
    rowValues.forEach((val, i) => {
      const padding = 2
      const maxW = colWidths[i] - padding * 2
      const fitted = doc.splitTextToSize(val, maxW) as string[]
      doc.text(fitted[0] ?? val, colX[i] + padding, dataY)
    })
    currentY += rowHeight
  })

  // Linha de total (opcional)
  if (totalLabel) {
    doc.setFillColor(57, 67, 83)
    doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(255, 255, 255)
    doc.text(totalLabel, marginLeft + contentWidth - 2, currentY + rowHeight - 2, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    currentY += rowHeight
  }

  // Bordas da tabela
  const totalHeight = currentY - y
  doc.setLineWidth(0.3)
  doc.setDrawColor(0, 0, 0)
  doc.rect(marginLeft, y, contentWidth, totalHeight)
  colX.slice(1).forEach((cx2) => {
    doc.line(cx2, y, cx2, y + totalHeight)
  })
  doc.line(marginLeft, y + headerHeight, marginLeft + contentWidth, y + headerHeight)
  for (let ri = 1; ri < rows.length + (totalLabel ? 1 : 0); ri++) {
    const lineY = y + headerHeight + ri * rowHeight
    doc.line(marginLeft, lineY, marginLeft + contentWidth, lineY)
  }

  return currentY + 4
}

// ── função principal ──────────────────────────────────────────────────────────

function _buildDoc(dados: DadosNotificacao, numeroAdvertencia: '1a' | '2a' = '1a'): { doc: jsPDF; nomeArquivo: string } {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const marginLeft = 25
  const marginRight = 25
  const pageWidth = 210
  const contentWidth = pageWidth - marginLeft - marginRight
  const lh = 5.5   // line height
  const lhSm = 5   // compact line height

  // ── Textos variáveis por tipo ────────────────────────────────
  const titulo1 =
    dados.tipo === 'fundo_propaganda'
      ? 'NÃO PAGAMENTO DE TAXA DE PROPAGANDA'
      : 'NÃO PAGAMENTO DE ROYALTIES'

  const clausulaObrigacao =
    dados.tipo === 'fundo_propaganda'
      ? 'Promover o pagamento da Taxa de Marketing/Fundo de Propaganda Mensal, estando ciente de que o não pagamento de tal taxa enseja a aplicação de encargos de atraso sobre os valores devidos, correção monetária, e a(o) coloca em posição de inadimplemento contratual passível de penalização. (Cláusulas 33ª e demais dispositivos pertinentes do CONTRATO);'
      : 'Promover o pagamento dos Royalties Mensais, estando ciente de que o não pagamento de tal valor enseja a aplicação de encargos de atraso sobre os valores devidos, correção monetária, e a(o) coloca em posição de inadimplemento contratual passível de penalização. (Cláusulas pertinentes do CONTRATO);'

  const clausulaFinal =
    dados.tipo === 'fundo_propaganda'
      ? 'Promova o pagamento integral do débito integral de Taxa de Marketing/Fundo de Propaganda Mensal, acima detalhado;'
      : 'Promova o pagamento integral do débito integral de Taxa de Royalties, acima detalhado;'

  const dataEmissao =
    dados.dataEmissao ||
    new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Qualificação inline do franqueado ──────────────────────
  const partes: string[] = [dados.nomeCompleto]
  if (dados.nacionalidade) partes.push(dados.nacionalidade)
  if (dados.profissao) partes.push(dados.profissao)
  if (dados.estadoCivilDoc) partes.push(dados.estadoCivilDoc)
  if (dados.rg) partes.push(`portadora(o) da Carteira de Identidade n. ${dados.rg}`)
  partes.push(`inscrita(o) no CPF sob o n. ${dados.cpf}`)
  if (dados.endereco) partes.push(`residente e domiciliada(o) na ${dados.endereco}`)
  if (dados.email) partes.push(`endereço e e-mail: ${dados.email}`)

  const qualificacaoFinal = partes.join(', ') + ' –, daqui adiante identificada(o) como "FRANQUEADA(O)".'

  let y = 20
  doc.setTextColor(0, 0, 0)

  // ─────────────────────────────────────────────────────────────
  // CABEÇALHO
  // ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('NOTIFICAÇÃO EXTRAJUDICIAL', pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(11)
  const textoAdvertencia = numeroAdvertencia === '2a' ? 'SEGUNDA ADVERTÊNCIA' : 'PRIMEIRA ADVERTÊNCIA'
  doc.text(textoAdvertencia, pageWidth / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(11)
  doc.text(titulo1, pageWidth / 2, y, { align: 'center' })
  y += 9

  // Linha separadora fina
  doc.setLineWidth(0.4)
  doc.line(marginLeft, y, pageWidth - marginRight, y)
  y += 7

  // ─────────────────────────────────────────────────────────────
  // UNIDADE FRANQUEADA (centrado, negrito, sublinhado)
  // ─────────────────────────────────────────────────────────────
  const unidadeTexto = `UNIDADE FRANQUEADA DE: ${dados.territorioUnidade.toUpperCase()}`
  addCenteredUnderlined(doc, unidadeTexto, y, pageWidth, 10, true)
  y += 9

  // ─────────────────────────────────────────────────────────────
  // AOS CUIDADOS DE  (parágrafo qualificação inline)
  // ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Aos cuidados de:', marginLeft, y)
  y += 6

  // Nome em bold, resto do parágrafo em normal
  y = addMixedParagraph(
    doc,
    [
      { text: dados.nomeCompleto, bold: true },
      { text: ', ' + qualificacaoFinal.slice(dados.nomeCompleto.length + 2), bold: false },
    ],
    marginLeft,
    y,
    contentWidth,
    lh
  )
  y += 5

  // ─────────────────────────────────────────────────────────────
  // ENCAMINHADA POR
  // ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Encaminhada por:', marginLeft, y)
  y += 6

  const encaminhada =
    'CRESCI E PERDI FRANCHISING LTDA, inscrita no CNPJ/MF sob o nº 27.767.670/0001-94, com endereço na Rua Campos Salles, nº 820, Centro, São José do Rio Pardo/SP, CEP 13.720-025 –, daqui adiante identificada como "FRANQUEADORA".'

  y = addText(doc, encaminhada, marginLeft, y, contentWidth, lh, false)
  y += 6

  // ─────────────────────────────────────────────────────────────
  // CORPO – parágrafo 1
  // ─────────────────────────────────────────────────────────────
  const paragrafo1 =
    'Por força do Contrato de Franquia Empresarial CRESCI E PERDI ("CONTRATO") entabulado, a(o) FRANQUEADA(O), uma vez adquirindo o direito de explorar uma unidade franqueada da Rede de Franquias Empresariais CRESCI E PERDI no Território acima destacado, assumiu uma série de obrigações perante a FRANQUEADORA, Franqueadora da Rede de Franquias Empresariais CRESCI E PERDI, dentre as quais pode se destacar as de:'

  y = addText(doc, paragrafo1, marginLeft, y, contentWidth, lhSm, false)
  y += 4

  // Bullet com asterisco – cláusula de obrigação
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('*', marginLeft + 3, y)
  y = addText(doc, clausulaObrigacao, marginLeft + 8, y, contentWidth - 8, lhSm, false)
  y += 5

  // ─────────────────────────────────────────────────────────────
  // CORPO – parágrafo 2 (inadimplência)
  // ─────────────────────────────────────────────────────────────
  const paragrafo2 =
    'Ocorre que, não obstante tenha assumido tais obrigações contratuais, a(o) FRANQUEADA(O), apesar de devidamente instruída(o) e cobrada(o), as inadimpliu, acumulando o seguinte débito perante a FRANQUEADORA:'

  y = addText(doc, paragrafo2, marginLeft, y, contentWidth, lhSm, false)
  y += 5

  // ─────────────────────────────────────────────────────────────
  // TABELA DE DÉBITO (6 colunas)
  // ─────────────────────────────────────────────────────────────
  const tableRows = dados.itensDebito && dados.itensDebito.length > 0
    ? dados.itensDebito.map(item => ({
        dataVencimento: item.dataVencimento || dados.mesCompetencia || '—',
        valorOriginal: formatarMoeda(item.valorOriginal),
        multa: formatarMoeda(item.valorMulta),
        juros: formatarMoeda(item.valorJuros),
        valorAtual: formatarMoeda(item.subtotal),
        referencia: item.referencia || dados.mesCompetencia || '—',
      }))
    : [{
        dataVencimento: dados.dataVencimento || dados.mesCompetencia || '—',
        valorOriginal: formatarMoeda(dados.valorOriginal),
        multa: formatarMoeda(dados.valorMulta),
        juros: formatarMoeda(dados.valorJuros),
        valorAtual: formatarMoeda(dados.valorTotal),
        referencia: dados.referencia || dados.mesCompetencia || '—',
      }]
  const totalDebtLabel = dados.itensDebito && dados.itensDebito.length > 1
    ? `TOTAL GERAL: ${formatarMoeda(dados.valorTotal)}`
    : undefined
  y = drawDebtTable(doc, marginLeft, y, contentWidth, tableRows, totalDebtLabel)
  y += 4

  // ─────────────────────────────────────────────────────────────
  // ADVERTÊNCIA – parágrafo com trecho negrito+sublinhado
  // ─────────────────────────────────────────────────────────────
  //  "…a FRANQUEADORA, neste ato, adverte a(o) FRANQUEADA(O) – sendo esta a sua primeira
  //   advertência –, para que, NO PRAZO MÁXIMO DE 15 (QUINZE) DIAS:"
  const advPrefixo =
    'Diante do ocorrido, e se valendo do que lhe autorizam: a Cláusulas 33ª; a Cláusula 49ª; a Cláusula 51ª; a Cláusula 54ª; a Cláusula 55ª; todas do CONTRATO; dentre outros dispositivos contratuais pertinentes; a FRANQUEADORA, neste ato, '
  const textoAdvertenciaNum = numeroAdvertencia === '2a' ? 'segunda' : 'primeira'
  const advDestaque =
    `adverte a(o) FRANQUEADA(O) – sendo esta a sua ${textoAdvertenciaNum} advertência –, para que, NO PRAZO MÁXIMO DE 15 (QUINZE) DIAS:`

  y = addMixedParagraph(
    doc,
    [
      { text: advPrefixo, bold: false, underline: false },
      { text: advDestaque, bold: true, underline: true },
    ],
    marginLeft,
    y,
    contentWidth,
    lhSm
  )
  y += 4

  // Bullet com asterisco – cláusula final (negrito + sublinhado)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('*', marginLeft + 3, y)

  y = addMixedParagraph(
    doc,
    [{ text: clausulaFinal, bold: true, underline: true }],
    marginLeft + 8,
    y,
    contentWidth - 8,
    lhSm
  )
  y += 5

  // ─────────────────────────────────────────────────────────────
  // PARÁGRAFO FINAL – DECLARAÇÃO DE RESCISÃO (negrito caps em destaque)
  // ─────────────────────────────────────────────────────────────
  const p4prefixo =
    'A(O) FRANQUEADA(O) fica desde já cientificada(o) de que, caso persista em seu comportamento de inadimplemento contratual, ela(e) será novamente advertida(o) e eventualmente multada(o), e, por fim, sofrerá com a '
  const p4destaque =
    'DECLARAÇÃO DA RESCISÃO DO CONTRATO DE FRANQUIA EMPRESARIAL CRESCI E PERDI, POR SUA CULPA,'
  const p4sufixo =
    ' com a aplicação das consequências previstas nas Cláusulas 49ª e seguintes do CONTRATO firmado.'

  y = addMixedParagraph(
    doc,
    [
      { text: p4prefixo, bold: false },
      { text: p4destaque, bold: true, underline: true },
      { text: p4sufixo, bold: false },
    ],
    marginLeft,
    y,
    contentWidth,
    lhSm
  )
  y += 5

  const paragrafo5 =
    'Feitas tais considerações, e contando com o acolhimento de todos os pedidos supra, nos prazos assinalados, sob pena da adoção das medidas adicionais pertinentes, subscreve-se a presente.'

  y = addText(doc, paragrafo5, marginLeft, y, contentWidth, lhSm, false)
  y += 12

  // ─────────────────────────────────────────────────────────────
  // RODAPÉ – data alinhada à direita + assinatura
  // ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(
    `São José do Rio Pardo, ${dataEmissao}.`,
    pageWidth - marginRight,
    y,
    { align: 'right' }
  )
  y += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Pela FRANQUEADORA e ora Notificante', marginLeft, y)
  y += 6
  doc.text('CRESCI E PERDI FRANCHISING LTDA', marginLeft, y)
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, marginLeft + 80, y)
  y += 5
  doc.text('Assinatura / Representante Legal', marginLeft, y)

  const tipoLabel = dados.tipo === 'fundo_propaganda' ? 'Fundo_Propaganda' : 'Royalties'
  const nomeArquivo = `Notificacao_${tipoLabel}_${dados.nomeCompleto.replace(/\s+/g, '_')}.pdf`
  return { doc, nomeArquivo }
}

export function gerarNotificacaoPDF(dados: DadosNotificacao): void {
  const { doc, nomeArquivo } = _buildDoc(dados)
  doc.save(nomeArquivo)
}

export function gerarNotificacaoPDFBase64(dados: DadosNotificacao, numeroAdvertencia: '1a' | '2a' = '1a'): { base64: string; nomeArquivo: string } {
  const { doc, nomeArquivo } = _buildDoc(dados, numeroAdvertencia)
  const dataUri = doc.output('datauristring') as string
  const base64 = dataUri.split(',')[1]
  return { base64, nomeArquivo }
}
