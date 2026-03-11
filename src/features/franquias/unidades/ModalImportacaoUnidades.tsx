// =====================================================
// MODAL DE IMPORTAÇÃO DE UNIDADES FRANQUEADAS
// Importação em lote via planilha Excel (.xlsx)
// =====================================================

import React, { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'

interface ModalImportacaoUnidadesProps {
  onClose: () => void
  onComplete?: () => void
}

interface ImportResult {
  sucesso: number
  erros: Array<{ linha: number; unidade: string; erro: string }>
  unidadesImportadas: string[]
}

interface ProgressoImport {
  processados: number
  total: number
  sucessos: number
  erros: number
  mensagem: string
}

// Colunas da planilha modelo
const modeloHeaders = [
  'codigo_unidade',
  'nome_unidade',
  'nome_fantasia',
  'status',
  'etapa_atual',
  'modelo_unidade',
  'nome_franqueado',
  'cpf_cnpj_franqueado',
  'email_franqueado',
  'telefone_franqueado',
  'data_abertura',
  'data_assinatura_contrato',
  'cep',
  'rua',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'tipo_contrato',
  'prazo_contrato_meses',
  'data_inicio_contrato',
  'data_termino_contrato',
  'taxa_franquia',
  'royalties_valor',
  'fundo_marketing_valor',
  'taxa_tecnologica',
  'tamanho_loja_m2',
  'capacidade_operacional',
  'faturamento_meta_mensal',
  'horario_funcionamento',
]

const STATUS_VALIDOS = ['prospeccao', 'pre_contrato', 'implantacao', 'inauguracao', 'ativa', 'suspensa', 'encerrada']
const ETAPA_VALIDA = ['prospeccao', 'pre_contrato', 'implantacao', 'inauguracao', 'operacao', 'suspensao', 'encerramento']
const MODELO_VALIDO = ['loja', 'quiosque', 'dark_kitchen', 'home_office', 'outro']

export const ModalImportacaoUnidades: React.FC<ModalImportacaoUnidadesProps> = ({ onClose, onComplete }) => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState<ProgressoImport | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Download do modelo ─────────────────────────────────────────────────────
  const handleDownloadModelo = () => {
    const exemplo = [
      {
        codigo_unidade: 'UNI-001',
        nome_unidade: 'Cresci e Perdi - São Paulo Centro',
        nome_fantasia: 'SP Centro',
        status: 'ativa',
        etapa_atual: 'operacao',
        modelo_unidade: 'loja',
        nome_franqueado: 'João Silva',
        cpf_cnpj_franqueado: '123.456.789-09',
        email_franqueado: 'joao@email.com',
        telefone_franqueado: '(11) 99999-0001',
        data_abertura: '2023-01-15',
        data_assinatura_contrato: '2022-12-01',
        cep: '01310-100',
        rua: 'Av. Paulista',
        numero: '1000',
        complemento: 'Loja 5',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        tipo_contrato: 'Franquia Padrão',
        prazo_contrato_meses: 60,
        data_inicio_contrato: '2023-01-01',
        data_termino_contrato: '2028-01-01',
        taxa_franquia: 30000,
        royalties_valor: 1500,
        fundo_marketing_valor: 800,
        taxa_tecnologica: 500,
        tamanho_loja_m2: 80,
        capacidade_operacional: 10,
        faturamento_meta_mensal: 50000,
        horario_funcionamento: 'Seg-Sex: 09h-18h / Sáb: 09h-14h',
      },
      {
        codigo_unidade: 'UNI-002',
        nome_unidade: 'Cresci e Perdi - Campinas',
        nome_fantasia: 'Campinas',
        status: 'implantacao',
        etapa_atual: 'implantacao',
        modelo_unidade: 'quiosque',
        nome_franqueado: 'Maria Oliveira',
        cpf_cnpj_franqueado: '98.765.432/0001-10',
        email_franqueado: 'maria@email.com',
        telefone_franqueado: '(19) 99999-0002',
        data_abertura: '',
        data_assinatura_contrato: '2024-06-01',
        cep: '13015-905',
        rua: 'Rua Barão de Jaguara',
        numero: '500',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Campinas',
        estado: 'SP',
        tipo_contrato: 'Franquia Quiosque',
        prazo_contrato_meses: 36,
        data_inicio_contrato: '2024-07-01',
        data_termino_contrato: '2027-07-01',
        taxa_franquia: 15000,
        royalties_valor: 800,
        fundo_marketing_valor: 400,
        taxa_tecnologica: 300,
        tamanho_loja_m2: 20,
        capacidade_operacional: 5,
        faturamento_meta_mensal: 25000,
        horario_funcionamento: 'Seg-Dom: 10h-22h',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(exemplo, { header: modeloHeaders })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Unidades')
    ws['!cols'] = modeloHeaders.map(h =>
      ['nome_unidade', 'nome_franqueado', 'rua', 'horario_funcionamento'].includes(h)
        ? { wch: 35 }
        : { wch: 22 }
    )
    XLSX.writeFile(wb, 'modelo_importacao_unidades.xlsx')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  // ── Parse de datas ─────────────────────────────────────────────────────────
  const parseDate = (v: any): string | null => {
    if (v === undefined || v === null || v === '') return null
    if (typeof v === 'number') {
      const ms = (v - 25569) * 86400 * 1000
      const d = new Date(ms)
      if (isNaN(d.getTime())) return null
      const yyyy = d.getUTCFullYear()
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
    const s = String(v).trim()
    if (!s) return null
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
    const brMatch = s.match(/^(\d{2})[/\-](\d{2})[/\-](\d{4})/)
    if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    return null
  }

  const str = (v: any) => (v !== undefined && v !== null && v !== '' ? String(v).trim() : null)
  const num = (v: any) => (v !== undefined && v !== null && v !== '' ? parseFloat(String(v)) : null)
  const intVal = (v: any) => (v !== undefined && v !== null && v !== '' ? parseInt(String(v)) : null)

  // ── Importação ─────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setProgress(null)
    setResult(null)
    const erros: Array<{ linha: number; unidade: string; erro: string }> = []
    const unidadesImportadas: string[] = []

    try {
      // Obtém empresa_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')
      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()
      const empresaId = userData?.empresa_id
      if (!empresaId) throw new Error('Usuário não possui empresa associada')

      // Lê o arquivo Excel
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)

      if (rows.length === 0) {
        setResult({ sucesso: 0, erros: [{ linha: 0, unidade: 'Geral', erro: 'Planilha vazia' }], unidadesImportadas: [] })
        setLoading(false)
        return
      }

      setLoading(false)

      let sucessos = 0
      let erroCount = 0

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const linha = i + 2
        const nomeUnidade = str(row.nome_unidade) || str(row.codigo_unidade) || `Linha ${linha}`

        setProgress({ processados: i, total: rows.length, sucessos, erros: erroCount, mensagem: `Processando: ${nomeUnidade}` })

        try {
          // Validações obrigatórias (apenas os campos mínimos)
          if (!str(row.codigo_unidade)) {
            erros.push({ linha, unidade: nomeUnidade, erro: 'codigo_unidade é obrigatório' })
            erroCount++
            continue
          }
          if (!str(row.nome_unidade)) {
            erros.push({ linha, unidade: nomeUnidade, erro: 'nome_unidade é obrigatório' })
            erroCount++
            continue
          }

          // Status: usa default se não informado ou inválido
          const statusRaw = str(row.status)?.toLowerCase()
          const statusVal = statusRaw && STATUS_VALIDOS.includes(statusRaw) ? statusRaw : 'prospeccao'

          // Etapa: usa default se não informado ou inválido
          const etapaRaw = str(row.etapa_atual)?.toLowerCase()
          const etapaVal = etapaRaw && ETAPA_VALIDA.includes(etapaRaw) ? etapaRaw : 'prospeccao'

          // Modelo: aceita null se não informado ou inválido
          const modeloRaw = str(row.modelo_unidade)?.toLowerCase()
          const modeloVal = modeloRaw && MODELO_VALIDO.includes(modeloRaw) ? modeloRaw : null

          // ── Vinculação automática de cliente pelo CNPJ do franqueado ──────────
          let clienteVinculadoId: number | null = null
          const cnpjRaw = str(row.cpf_cnpj_franqueado)
          if (cnpjRaw) {
            const cnpjSomenteDigitos = cnpjRaw.replace(/\D/g, '')
            if (cnpjSomenteDigitos.length === 14) {
              const { data: clienteEncontrado } = await supabase
                .from('clientes')
                .select('id')
                .eq('empresa_id', empresaId)
                .eq('cnpj', cnpjSomenteDigitos)
                .maybeSingle()
              if (clienteEncontrado?.id) {
                clienteVinculadoId = clienteEncontrado.id
              }
            }
          }

          const payload: Record<string, any> = {
            empresa_id: empresaId,
            codigo_unidade: str(row.codigo_unidade)!,
            nome_unidade: str(row.nome_unidade)!,
            nome_fantasia: str(row.nome_fantasia),
            status: statusVal,
            etapa_atual: etapaVal,
            modelo_unidade: modeloVal,
            nome_franqueado: str(row.nome_franqueado) || '',
            cpf_cnpj_franqueado: cnpjRaw,
            cliente_id: clienteVinculadoId,
            email_franqueado: str(row.email_franqueado),
            telefone_franqueado: str(row.telefone_franqueado),
            data_abertura: parseDate(row.data_abertura),
            data_assinatura_contrato: parseDate(row.data_assinatura_contrato),
            cep: str(row.cep),
            rua: str(row.rua),
            numero: str(row.numero),
            complemento: str(row.complemento),
            bairro: str(row.bairro),
            cidade: str(row.cidade),
            estado: str(row.estado)?.toUpperCase() || null,
            pais: 'Brasil',
            tipo_contrato: str(row.tipo_contrato),
            prazo_contrato_meses: intVal(row.prazo_contrato_meses),
            data_inicio_contrato: parseDate(row.data_inicio_contrato),
            data_termino_contrato: parseDate(row.data_termino_contrato),
            taxa_franquia: num(row.taxa_franquia),
            royalties_percentual: num(row.royalties_valor),
            fundo_marketing_percentual: num(row.fundo_marketing_valor),
            taxa_tecnologica: num(row.taxa_tecnologica),
            tamanho_loja_m2: num(row.tamanho_loja_m2),
            capacidade_operacional: intVal(row.capacidade_operacional),
            faturamento_meta_mensal: num(row.faturamento_meta_mensal),
            horario_funcionamento: str(row.horario_funcionamento)
              ? { descricao: str(row.horario_funcionamento)! }
              : null,
            created_by: user.id,
            updated_by: user.id,
          }

          // Remove campos nulos para não sobrescrever defaults
          Object.keys(payload).forEach(key => {
            if (payload[key] === null && !['nome_fantasia', 'cliente_id', 'data_abertura', 'data_assinatura_contrato', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'data_inicio_contrato', 'data_termino_contrato'].includes(key)) {
              // mantém nulos apenas em campos de endereço/datas opcionais e cliente_id
            }
          })

          // Tenta INSERT; se duplicar codigo_unidade+empresa_id → UPDATE
          const { error: insertError } = await supabase
            .from('franquia_unidades')
            .insert(payload)

          if (insertError) {
            const eDuplicado =
              insertError.code === '23505' ||
              insertError.message?.toLowerCase().includes('duplicate') ||
              insertError.message?.toLowerCase().includes('unique')

            if (eDuplicado) {
              // Atualiza pelo codigo_unidade
              const { nome_unidade, created_by, ...updatePayload } = payload
              const { error: updateError } = await supabase
                .from('franquia_unidades')
                .update({ ...updatePayload, nome_unidade })
                .eq('empresa_id', empresaId)
                .eq('codigo_unidade', payload.codigo_unidade)

              if (updateError) {
                erros.push({ linha, unidade: nomeUnidade, erro: updateError.message })
                erroCount++
                continue
              }
            } else {
              erros.push({ linha, unidade: nomeUnidade, erro: insertError.message })
              erroCount++
              continue
            }
          }

          const vinculoLabel = clienteVinculadoId ? ' ✔ cliente vinculado' : ''
          unidadesImportadas.push(`${payload.codigo_unidade} — ${payload.nome_unidade}${vinculoLabel}`)
          sucessos++

        } catch (err: any) {
          const msg = err?.message || String(err)
          erros.push({ linha, unidade: nomeUnidade, erro: msg })
          erroCount++
        }
      }

      setProgress({ processados: rows.length, total: rows.length, sucessos, erros: erroCount, mensagem: 'Importação concluída!' })
      setResult({ sucesso: sucessos, erros, unidadesImportadas })
      if (onComplete) onComplete()

    } catch (err: any) {
      const msg = err?.message || String(err)
      setResult({ sucesso: 0, erros: [{ linha: 0, unidade: 'Geral', erro: msg }], unidadesImportadas: [] })
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#C9C4B5' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" style={{ color: '#394353' }} />
              Importar Unidades Franqueadas
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Estado: lendo arquivo */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto mb-4" style={{ borderTopColor: '#394353' }}></div>
              <p className="text-sm font-medium text-gray-700">Lendo arquivo...</p>
              <p className="text-xs text-gray-500 mt-2">Aguarde enquanto o arquivo é processado</p>
            </div>
          )}

          {/* Estado: barra de progresso */}
          {!loading && progress && !result && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#f0f4f8', borderColor: '#C9C4B5' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Importando unidades...</p>
                    <p className="text-xs text-slate-600 mt-1">{progress.mensagem}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{progress.processados}</p>
                    <p className="text-xs text-slate-600">de {progress.total}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? Math.min(100, Math.round((progress.processados / progress.total) * 100)) : 0}%`,
                      backgroundColor: '#394353',
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-800">
                    {progress.total > 0 ? Math.round((progress.processados / progress.total) * 100) : 0}% Completo
                  </p>
                  <p className="text-xs text-slate-600">
                    {progress.sucessos} ✓ {progress.erros > 0 && `${progress.erros} ✗`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{progress.sucessos}</div>
                  <div className="text-xs font-medium text-green-700 mt-1">Importadas</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">{progress.erros}</div>
                  <div className="text-xs font-medium text-red-700 mt-1">Erros</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-600">{progress.total - progress.processados}</div>
                  <div className="text-xs font-medium text-amber-700 mt-1">Restante</div>
                </div>
              </div>
            </div>
          )}

          {/* Estado: seleção de arquivo inicial */}
          {!loading && !progress && !result && (
            <>
              {/* Instruções */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Como importar unidades</h3>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Baixe a planilha modelo clicando no botão abaixo</li>
                      <li>Preencha as colunas seguindo os exemplos</li>
                      <li>Campo obrigatório: <strong>codigo_unidade, nome_unidade</strong></li>
                      <li>Status válidos (opcional): <em>prospeccao, pre_contrato, implantacao, inauguracao, ativa, suspensa, encerrada</em> — padrão: <strong>prospeccao</strong></li>
                      <li>Salve em formato <strong>.xlsx</strong> e faça o upload</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Botão modelo */}
              <div className="mb-4">
                <button
                  onClick={handleDownloadModelo}
                  className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md text-sm font-medium hover:bg-gray-50 transition"
                  style={{ borderColor: '#C9C4B5', color: '#394353' }}
                >
                  <Download className="w-4 h-4" />
                  Baixar Planilha Modelo
                </button>
              </div>

              {/* Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 px-4 border-2 border-dashed rounded-lg hover:bg-gray-50 transition text-center"
                  style={{ borderColor: '#C9C4B5' }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#394353' }} />
                  {file ? (
                    <div className="text-sm font-medium text-gray-700">{file.name}</div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-gray-700">Clique para selecionar o arquivo</div>
                      <div className="text-xs text-gray-500 mt-1">Formato: .xlsx ou .xls</div>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Estado: resultado */}
          {result && (
            <div className="space-y-6">
              {/* Cards de resultado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{result.sucesso}</div>
                  <p className="text-sm font-semibold text-green-900 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Unidades Importadas
                  </p>
                </div>
                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">{result.erros.length}</div>
                  <p className="text-sm font-semibold text-red-900 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Registros com Erro
                  </p>
                </div>
              </div>

              {/* Erros detalhados */}
              {result.erros.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {result.erros.length} Problema{result.erros.length > 1 ? 's' : ''} Encontrado{result.erros.length > 1 ? 's' : ''}
                  </h3>
                  <div className="bg-red-50 border border-red-300 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    {result.erros.map((erro, i) => (
                      <div key={i} className="p-3 border-b border-red-200 last:border-b-0 hover:bg-red-100 transition-colors">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-bold text-xs whitespace-nowrap">Linha {erro.linha}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-red-900 break-words">{erro.unidade}</p>
                            <p className="text-xs text-red-700 mt-1 bg-white rounded px-2 py-1 break-words">{erro.erro}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unidades importadas */}
              {result.unidadesImportadas.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-green-900 mb-3">
                    {result.unidadesImportadas.length} Unidade{result.unidadesImportadas.length > 1 ? 's' : ''} com Sucesso
                  </h3>
                  <div className="bg-green-50 border border-green-300 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    {result.unidadesImportadas.map((u, i) => (
                      <div key={i} className="p-3 border-b border-green-200 last:border-b-0 hover:bg-green-100 transition-colors flex items-center gap-2">
                        <span className="text-green-600 font-bold">+</span>
                        <span className="text-xs text-green-900 font-medium">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="mt-6 flex justify-end gap-2">
            {!result && !loading && (
              <button
                onClick={handleImport}
                disabled={!file}
                className="px-4 py-2 text-white text-sm font-semibold rounded-md hover:opacity-90 transition disabled:opacity-40"
                style={{ backgroundColor: '#394353' }}
              >
                Importar
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-200 transition"
            >
              {result ? 'Fechar' : 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalImportacaoUnidades
