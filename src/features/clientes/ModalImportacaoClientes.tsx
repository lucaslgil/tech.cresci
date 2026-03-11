import React, { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { ClienteFormData } from './types'
import type { ProgressoCallback } from './importacaoService'
import { corrigirEnderecosSemDados, type CorrecaoEnderecoResult } from './importacaoService'

interface ModalImportacaoClientesProps {
  onClose: () => void
  onImport: (clientes: ClienteFormData[], onProgress?: (progresso: ProgressoCallback) => void) => Promise<{
    sucesso: number
    erros: Array<{ linha: number; cliente: string; erro: string }>
    clientesImportados: string[]
  }>
  onComplete?: () => void
}

interface ImportResult {
  sucesso: number
  erros: Array<{ linha: number; cliente: string; erro: string }>
  clientesImportados: string[]
}

export const ModalImportacaoClientes: React.FC<ModalImportacaoClientesProps> = ({ onClose, onImport, onComplete }) => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState<ProgressoCallback | null>(null)
  const [corrigindo, setCorrigindo] = useState(false)
  const [progressoCorrecao, setProgressoCorrecao] = useState<{ atual: number; total: number } | null>(null)
  const [resultadoCorrecao, setResultadoCorrecao] = useState<CorrecaoEnderecoResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modeloHeaders = [
    'tipo_pessoa',
    'nome_completo',
    'cpf',
    'data_nascimento',
    'razao_social',
    'nome_fantasia',
    'cnpj',
    'inscricao_estadual',
    'regime_tributario',
    'contribuinte_icms',
    'consumidor_final',
    'limite_credito',
    'status',
    'email',
    'telefone',
    'endereco_cep',
    'endereco_logradouro',
    'endereco_numero',
    'endereco_complemento',
    'endereco_bairro',
    'endereco_cidade',
    'endereco_estado',
    'observacoes'
  ]

  const handleDownloadModelo = () => {
    const exemplo: any[] = [
      {
        tipo_pessoa: 'FISICA',
        nome_completo: 'João Silva',
        cpf: '123.456.789-09',
        data_nascimento: '1980-01-01',
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        inscricao_estadual: '',
        regime_tributario: 'ISENTO',
        contribuinte_icms: 'CONTRIBUINTE',
        consumidor_final: true,
        limite_credito: 0,
        status: 'ATIVO',
        email: 'joao@email.com',
        telefone: '(11) 99999-0001',
        endereco_cep: '01310-100',
        endereco_logradouro: 'Av. Paulista',
        endereco_numero: '1000',
        endereco_complemento: 'Apto 12',
        endereco_bairro: 'Bela Vista',
        endereco_cidade: 'São Paulo',
        endereco_estado: 'SP',
        observacoes: ''
      },
      {
        tipo_pessoa: 'JURIDICA',
        nome_completo: '',
        cpf: '',
        data_nascimento: '',
        razao_social: 'Empresa Exemplo LTDA',
        nome_fantasia: 'Empresa Exemplo',
        cnpj: '12.345.678/0001-99',
        inscricao_estadual: '123456789',
        regime_tributario: 'SIMPLES_NACIONAL',
        contribuinte_icms: 'CONTRIBUINTE',
        consumidor_final: false,
        limite_credito: 1000,
        status: 'ATIVO',
        email: 'contato@empresa.com',
        telefone: '(11) 3333-4444',
        endereco_cep: '04538-133',
        endereco_logradouro: 'Rua Funchal',
        endereco_numero: '418',
        endereco_complemento: 'Sala 5',
        endereco_bairro: 'Vila Olímpia',
        endereco_cidade: 'São Paulo',
        endereco_estado: 'SP',
        observacoes: ''
      }
    ]

    const ws = XLSX.utils.json_to_sheet(exemplo, { header: modeloHeaders })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    ws['!cols'] = modeloHeaders.map((h) => ({
      wch: ['endereco_logradouro', 'razao_social', 'nome_completo'].includes(h) ? 30 : 20
    }))
    XLSX.writeFile(wb, 'modelo_importacao_clientes.xlsx')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const parseBoolean = (v: any) => {
    if (typeof v === 'boolean') return v
    if (!v) return false
    const s = String(v).toLowerCase()
    return s === 'sim' || s === 'true' || s === '1' || s === 'yes'
  }

  /**
   * Converte datas do Excel (serial numérico) ou strings (DD/MM/YYYY, YYYY-MM-DD)
   * para o formato ISO YYYY-MM-DD esperado pelo Supabase.
   */
  const parseDate = (v: any): string | undefined => {
    if (v === undefined || v === null || v === '') return undefined

    // Número serial do Excel (ex: 29738, 29738.5)
    if (typeof v === 'number') {
      // Excel considera 1900-01-01 = 1, com bug de bissexto em 1900.
      // Fórmula: dias desde 1899-12-30 (offset usado pela biblioteca)
      const ms = (v - 25569) * 86400 * 1000
      const d = new Date(ms)
      if (isNaN(d.getTime())) return undefined
      const yyyy = d.getUTCFullYear()
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    const s = String(v).trim()
    if (!s) return undefined

    // Já está em YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)

    // DD/MM/YYYY ou DD-MM-YYYY
    const brMatch = s.match(/^(\d{2})[/\-](\d{2})[/\-](\d{4})/)
    if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`

    // Tenta parse genérico como último recurso
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    return undefined
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setProgress(null)
    setResult(null)
    const erros: Array<{ linha: number; cliente: string; erro: string }> = []
    const clientesValidados: ClienteFormData[] = []

    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)

      if (rows.length === 0) {
        setResult({ sucesso: 0, erros: [{ linha: 0, cliente: 'Geral', erro: 'Planilha vazia' }], clientesImportados: [] })
        setLoading(false)
        return
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const linha = i + 2
        try {
          // Inferir tipo_pessoa se vazio: se tem CNPJ válido → JURIDICA, se tem CPF → FISICA
          let tipo = String(row.tipo_pessoa || '').toUpperCase().trim()
          if (tipo !== 'FISICA' && tipo !== 'JURIDICA') {
            if (row.cnpj && row.cnpj != 0 && String(row.cnpj).replace(/\D/g,'').length >= 11) {
              tipo = 'JURIDICA'
            } else if (row.cpf && row.cpf != 0) {
              tipo = 'FISICA'
            } else {
              erros.push({ linha, cliente: row.nome_completo || row.razao_social || 'Sem nome', erro: `tipo_pessoa inválido: "${row.tipo_pessoa}" - deve ser FISICA ou JURIDICA` })
              continue
            }
          }

          if (tipo === 'FISICA') {
            if (!row.nome_completo || !row.cpf) {
              erros.push({ linha, cliente: row.nome_completo || 'Sem nome', erro: 'nome_completo e cpf obrigatórios para PF' })
              continue
            }
          } else {
            if (!row.razao_social || !row.cnpj) {
              erros.push({ linha, cliente: row.razao_social || 'Sem razão social', erro: 'razao_social e cnpj obrigatórios para PJ' })
              continue
            }
          }

          const cliente: ClienteFormData = {
            tipo_pessoa: tipo as any,
            nome_completo: row.nome_completo || undefined,
            cpf: (row.cpf && row.cpf != 0)
              ? String(Math.round(Number(row.cpf))).padStart(11, '0')
              : undefined,
            data_nascimento: parseDate(row.data_nascimento),
            razao_social: row.razao_social || undefined,
            nome_fantasia: row.nome_fantasia || undefined,
            cnpj: (row.cnpj && row.cnpj != 0)
              ? String(Math.round(Number(row.cnpj))).padStart(14, '0')
              : undefined,
            inscricao_estadual: row.inscricao_estadual !== undefined && row.inscricao_estadual !== null && row.inscricao_estadual !== '' ? String(row.inscricao_estadual).trim() : undefined,
            regime_tributario: row.regime_tributario || undefined,
            contribuinte_icms: row.contribuinte_icms || undefined,
            consumidor_final: parseBoolean(row.consumidor_final),
            limite_credito: row.limite_credito ? Number(row.limite_credito) : undefined,
            status: row.status ? String(row.status).trim().toUpperCase() as any : 'ATIVO',
            email: row.email ? String(row.email).trim() : undefined,
            telefone: row.telefone ? String(row.telefone).trim() : undefined,
            endereco_cep: row.endereco_cep != null && row.endereco_cep !== ''
              ? String(row.endereco_cep).replace(/\D/g, '').padStart(8, '0').substring(0, 8)
              : undefined,
            endereco_logradouro: row.endereco_logradouro != null && row.endereco_logradouro !== ''
              ? String(row.endereco_logradouro).trim() : undefined,
            endereco_numero: row.endereco_numero != null && row.endereco_numero !== ''
              ? String(row.endereco_numero).trim() : undefined,
            endereco_complemento: row.endereco_complemento != null && row.endereco_complemento !== ''
              ? String(row.endereco_complemento).trim() : undefined,
            endereco_bairro: row.endereco_bairro != null && row.endereco_bairro !== ''
              ? String(row.endereco_bairro).trim() : undefined,
            endereco_cidade: row.endereco_cidade != null && row.endereco_cidade !== ''
              ? String(row.endereco_cidade).trim() : undefined,
            endereco_estado: row.endereco_estado != null && row.endereco_estado !== ''
              ? String(row.endereco_estado).trim().toUpperCase() : undefined,
            observacoes: row.observacoes || undefined
          }

          clientesValidados.push(cliente)

        } catch (err: any) {
          const mensagem = err?.message || (typeof err === 'string' ? err : JSON.stringify(err))
          erros.push({ linha, cliente: row.nome_completo || row.razao_social || 'Sem nome', erro: mensagem })
        }
      }

      // Se não há clientes válidos
      if (clientesValidados.length === 0) {
        setResult({ sucesso: 0, erros, clientesImportados: [] })
        setLoading(false)
        return
      }

      // Desativa loading AQUI para mostrar a barra de progresso
      setLoading(false)

      // Chama onImport com callback de progresso e recebe resumo
      const resumo = await onImport(clientesValidados, (progresso) => {
        setProgress(progresso)
      })

      setResult({ sucesso: resumo.sucesso, erros: [...erros, ...resumo.erros], clientesImportados: resumo.clientesImportados })
      if (onComplete) onComplete()

    } catch (err: any) {
      const mensagem = err?.message || (typeof err === 'string' ? err : JSON.stringify(err))
      setResult({ sucesso: 0, erros: [{ linha: 0, cliente: 'Geral', erro: mensagem }], clientesImportados: [] })
      setLoading(false)
    }
  }

  const hasRlsError = (res: ImportResult | null) => {
    if (!res) return false
    return res.erros.some(e => /row[- ]level security|violates row[- ]level security/i.test(e.erro))
  }

  async function handleCorrigirEnderecos() {
    setCorrigindo(true)
    setResultadoCorrecao(null)
    setProgressoCorrecao({ atual: 0, total: 0 })
    try {
      const r = await corrigirEnderecosSemDados((atual, total) => {
        setProgressoCorrecao({ atual, total })
      })
      setResultadoCorrecao(r)
    } finally {
      setCorrigindo(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b" style={{ borderColor: '#C9C4B5' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" style={{ color: '#394353' }} />
              Importar Clientes
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-sm font-medium text-gray-700">Lendo arquivo...</p>
              <p className="text-xs text-gray-500 mt-2">Aguarde enquanto o arquivo é processado</p>
            </div>
          ) : progress ? (
            // BARRA DE PROGRESSO - MOSTRADA DURANTE A IMPORTAÇÃO
            <div className="space-y-6">
              {/* Etapa Atual */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {progress.etapa === 'validacao' && '📋'}
                      {progress.etapa === 'verificacao' && '🔍'}
                      {progress.etapa === 'insercao' && '📥'}
                      {progress.etapa === 'atualizacao' && '🔄'}
                      {progress.etapa === 'finalizacao' && '✨'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">
                        {progress.etapa === 'validacao' && 'Validando dados...'}
                        {progress.etapa === 'verificacao' && 'Verificando duplicatas...'}
                        {progress.etapa === 'insercao' && 'Inserindo clientes...'}
                        {progress.etapa === 'atualizacao' && 'Atualizando clientes...'}
                        {progress.etapa === 'finalizacao' && 'Finalizando importação...'}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">{progress.mensagem}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-900">{progress.processados}</p>
                    <p className="text-xs text-blue-700">de {progress.total}</p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden shadow-md">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-4 rounded-full transition-all duration-300 ease-out shadow-lg"
                    style={{ width: `${Math.min(100, Math.round((progress.processados / progress.total) * 100))}%` }}
                  />
                </div>

                {/* Percentual */}
                <div className="mt-3 flex justify-between items-center">
                  <p className="text-sm font-bold text-blue-900">
                    {Math.round((progress.processados / progress.total) * 100)}% Completo
                  </p>
                  <p className="text-xs text-blue-700">
                    {progress.sucessos} ✓ {progress.erros > 0 && `${progress.erros} ✗`}
                  </p>
                </div>
              </div>

              {/* Contadores em Tempo Real */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{progress.sucessos}</div>
                  <div className="text-xs font-medium text-green-700 mt-1">Importados</div>
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
          ) : !result ? (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Como importar clientes</h3>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Baixe a planilha modelo</li>
                      <li>Preencha os dados seguindo o modelo</li>
                      <li>Salve em formato .xlsx</li>
                      <li>Faça o upload do arquivo</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <button onClick={handleDownloadModelo} className="px-4 py-2 bg-white border rounded-md" style={{ borderColor: '#C9C4B5' }}>
                  <Download className="w-4 h-4 inline mr-2" /> Baixar Planilha Modelo
                </button>
              </div>

              <div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 px-4 border-2 border-dashed rounded-lg" style={{ borderColor: '#C9C4B5' }}>
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#394353' }} />
                  {file ? <div className="text-sm font-medium">{file.name}</div> : (
                    <>
                      <div className="text-sm font-medium">Clique para selecionar</div>
                      <div className="text-xs text-gray-500">Formato: .xlsx ou .xls</div>
                    </>
                  )}
                </button>
              </div>

              {/* Seção de correção para endereços já importados */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Endereços já importados com dados incompletos?
                </h3>
                <p className="text-xs text-amber-700 mb-3">
                  Se a importação anterior salvou o CEP mas não preencheu logradouro/bairro/cidade,
                  clique aqui para corrigir todos os registros automaticamente via ViaCEP.
                </p>
                {corrigindo && progressoCorrecao && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-amber-700 mb-1">
                      <span>Corrigindo endereços...</span>
                      <span>{progressoCorrecao.atual}/{progressoCorrecao.total}</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: progressoCorrecao.total ? `${Math.round((progressoCorrecao.atual / progressoCorrecao.total) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                )}
                {resultadoCorrecao && (
                  <div className="mb-3 p-2 bg-white border border-amber-200 rounded text-xs text-amber-900 space-y-0.5">
                    <p>✅ <strong>{resultadoCorrecao.corrigidos}</strong> endereços corrigidos</p>
                    {resultadoCorrecao.semCEP > 0 && <p>⚠️ <strong>{resultadoCorrecao.semCEP}</strong> sem CEP válido (ignorados)</p>}
                    {resultadoCorrecao.erros > 0 && <p>❌ <strong>{resultadoCorrecao.erros}</strong> falhas</p>}
                  </div>
                )}
                <button
                  onClick={handleCorrigirEnderecos}
                  disabled={corrigindo}
                  className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#394353' }}
                >
                  <RefreshCw className={`w-4 h-4 ${corrigindo ? 'animate-spin' : ''}`} />
                  {corrigindo ? 'Corrigindo...' : 'Corrigir Endereços Existentes'}
                </button>
              </div>
            </>
          ) : (
            <div>
              {/* Resumo Final */}
              <div className="space-y-6">
                {/* Cards de Resultado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{result.sucesso}</div>
                    <p className="text-sm font-semibold text-green-900">Clientes Importados</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg text-center">
                    <div className="text-4xl font-bold text-red-600 mb-2">{result.erros.length}</div>
                    <p className="text-sm font-semibold text-red-900">Registros com Erro</p>
                  </div>
                </div>

                {/* Erros Detalhados */}
                {result.erros.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {result.erros.length} Problemas Encontrados
                    </h3>
                    <div className="bg-red-50 border border-red-300 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      {result.erros.map((erro, i) => (
                        <div key={i} className="p-3 border-b border-red-200 last:border-b-0 hover:bg-red-100 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 font-bold text-sm">Linha {erro.linha}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-red-900 break-words">{erro.cliente}</p>
                              <p className="text-xs text-red-700 mt-1 bg-white rounded px-2 py-1 break-words">{erro.erro}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clientes Importados */}
                {result.clientesImportados.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-green-900 mb-3">
                      {result.clientesImportados.length} Cliente(s) com Sucesso
                    </h3>
                    <div className="bg-green-50 border border-green-300 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {result.clientesImportados.map((c, i) => (
                        <div key={i} className="p-3 border-b border-green-200 last:border-b-0 hover:bg-green-100 transition-colors flex items-center gap-2">
                          <span className="text-green-600 text-lg">+</span>
                          <span className="text-sm text-green-900 font-medium">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RLS Error Helper */}
                {hasRlsError(result) && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <h3 className="text-sm font-bold text-yellow-900 mb-2">* Erro de Segurança (RLS)</h3>
                    <p className="text-xs text-yellow-800 mb-3">
                      O Supabase bloqueou a inserção por Row-Level Security. Execute este SQL:
                    </p>
                    <div className="bg-white border border-yellow-300 rounded p-2 mb-3 font-mono text-xs text-gray-800 break-all">
                      ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
                    </div>
                    <button 
                      onClick={() => copyToClipboard('ALTER TABLE clientes ENABLE ROW LEVEL SECURITY; CREATE POLICY allow_insert ON clientes FOR INSERT TO authenticated WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));')}
                      className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Copiar SQL Completo
                    </button>
                  </div>
                )}

                {/* Correção de endereços incompletos */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Corrigir Endereços Incompletos
                  </h3>
                  <p className="text-xs text-blue-700 mb-3">
                    Consulta o ViaCEP para preencher logradouro, bairro e cidade nos registros que ficaram como "Não informado".
                  </p>
                  {corrigindo && progressoCorrecao && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-blue-700 mb-1">
                        <span>Corrigindo endereços...</span>
                        <span>{progressoCorrecao.atual}/{progressoCorrecao.total}</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: progressoCorrecao.total ? `${Math.round((progressoCorrecao.atual / progressoCorrecao.total) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  )}
                  {resultadoCorrecao && (
                    <div className="mb-3 p-2 bg-white border border-blue-200 rounded text-xs text-blue-900 space-y-0.5">
                      <p>✅ <strong>{resultadoCorrecao.corrigidos}</strong> endereços corrigidos</p>
                      {resultadoCorrecao.semCEP > 0 && <p>⚠️ <strong>{resultadoCorrecao.semCEP}</strong> sem CEP válido (ignorados)</p>}
                      {resultadoCorrecao.erros > 0 && <p>❌ <strong>{resultadoCorrecao.erros}</strong> falhas</p>}
                    </div>
                  )}
                  <button
                    onClick={handleCorrigirEnderecos}
                    disabled={corrigindo}
                    className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#394353' }}
                  >
                    <RefreshCw className={`w-4 h-4 ${corrigindo ? 'animate-spin' : ''}`} />
                    {corrigindo ? 'Corrigindo...' : 'Corrigir Endereços'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            {!result && (
              <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded-md">Importar</button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalImportacaoClientes
