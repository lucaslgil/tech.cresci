// =====================================================
// MODAL DE IMPORTAÇÃO DE PRODUTOS VIA PLANILHA
// Data: 26/01/2026
// =====================================================

import React, { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { ProdutoFormData } from './types'

interface ModalImportacaoProdutosProps {
  onClose: () => void
  onImport: (produtos: ProdutoFormData[]) => Promise<void>
  onComplete?: () => void
}

interface ImportResult {
  sucesso: number
  erros: Array<{
    linha: number
    produto: string
    erro: string
  }>
  produtosImportados: string[]
}

export const ModalImportacaoProdutos: React.FC<ModalImportacaoProdutosProps> = ({
  onClose,
  onImport,
  onComplete
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gerar planilha exemplo para download
  const handleDownloadExemplo = () => {
    const exemploProdutos = [
      {
        codigo_interno: '000001',
        codigo_barras: '7891234567890',
        nome: 'Produto Exemplo 1',
        descricao: 'Descrição detalhada do produto',
        categoria: 'TECNOLOGIA',
        unidade_medida: 'UN',
        ncm: '84713012',
        cest: '',
        origem_mercadoria: 0,
        preco_custo: 100.00,
        preco_venda: 150.00,
        margem_lucro: 50,
        permite_desconto: 'SIM',
        desconto_maximo: 10,
        estoque_atual: 10,
        estoque_minimo: 5,
        estoque_maximo: 50,
        localizacao: 'A1',
        controla_lote: 'NAO',
        controla_serie: 'NAO',
        controla_validade: 'NAO',
        dias_validade: '',
        ativo: 'SIM',
        observacoes: 'Observações do produto'
      },
      {
        codigo_interno: '000002',
        codigo_barras: '7891234567891',
        nome: 'Produto Exemplo 2',
        descricao: 'Outro produto de exemplo',
        categoria: 'ALIMENTOS',
        unidade_medida: 'KG',
        ncm: '19059090',
        cest: '',
        origem_mercadoria: 0,
        preco_custo: 50.00,
        preco_venda: 80.00,
        margem_lucro: 60,
        permite_desconto: 'SIM',
        desconto_maximo: 5,
        estoque_atual: 20,
        estoque_minimo: 10,
        estoque_maximo: 100,
        localizacao: 'B2',
        controla_lote: 'SIM',
        controla_serie: 'NAO',
        controla_validade: 'SIM',
        dias_validade: '90',
        ativo: 'SIM',
        observacoes: ''
      }
    ]

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(exemploProdutos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos')

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // codigo_interno
      { wch: 18 }, // codigo_barras
      { wch: 35 }, // nome
      { wch: 40 }, // descricao
      { wch: 15 }, // categoria
      { wch: 12 }, // unidade_medida
      { wch: 12 }, // ncm
      { wch: 10 }, // cest
      { wch: 18 }, // origem_mercadoria
      { wch: 15 }, // preco_custo
      { wch: 15 }, // preco_venda
      { wch: 15 }, // margem_lucro
      { wch: 18 }, // permite_desconto
      { wch: 18 }, // desconto_maximo
      { wch: 15 }, // estoque_atual
      { wch: 15 }, // estoque_minimo
      { wch: 15 }, // estoque_maximo
      { wch: 12 }, // localizacao
      { wch: 15 }, // controla_lote
      { wch: 15 }, // controla_serie
      { wch: 18 }, // controla_validade
      { wch: 15 }, // dias_validade
      { wch: 8 },  // ativo
      { wch: 40 }  // observacoes
    ]
    ws['!cols'] = colWidths

    // Download
    XLSX.writeFile(wb, 'modelo_importacao_produtos.xlsx')
  }

  // Processar arquivo selecionado
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  // Converter valor para booleano
  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const upper = value.toUpperCase()
      return upper === 'SIM' || upper === 'TRUE' || upper === '1'
    }
    return false
  }

  // Processar e importar planilha
  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setProgress({ current: 0, total: 0 })
    const erros: Array<{ linha: number; produto: string; erro: string }> = []
    const produtosImportados: string[] = []

    try {
      // Ler arquivo
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        erros.push({ linha: 0, produto: 'Geral', erro: 'Planilha vazia ou sem dados válidos' })
        setResult({ sucesso: 0, erros, produtosImportados: [] })
        setLoading(false)
        return
      }

      // Definir total de produtos
      setProgress({ current: 0, total: jsonData.length })

      // Processar cada linha
      const produtos: Array<{ data: ProdutoFormData; linha: number; nome: string }> = []
      
      jsonData.forEach((row: any, index: number) => {
        const linha = index + 2 // +2 porque começa da linha 2 (linha 1 é cabeçalho)
        
        try {
          // Validações básicas
          if (!row.codigo_interno) {
            erros.push({ 
              linha, 
              produto: row.nome || 'Produto sem nome', 
              erro: 'Código interno obrigatório' 
            })
            return
          }
          if (!row.nome) {
            erros.push({ 
              linha, 
              produto: row.codigo_interno, 
              erro: 'Nome obrigatório' 
            })
            return
          }
          if (!row.ncm) {
            erros.push({ 
              linha, 
              produto: row.nome, 
              erro: 'NCM obrigatório' 
            })
            return
          }
          if (!row.preco_venda || Number(row.preco_venda) <= 0) {
            erros.push({ 
              linha, 
              produto: row.nome, 
              erro: 'Preço de venda obrigatório e deve ser maior que zero' 
            })
            return
          }

          const produto: ProdutoFormData = {
            codigo_interno: String(row.codigo_interno),
            codigo_barras: row.codigo_barras ? String(row.codigo_barras) : '',
            nome: String(row.nome),
            descricao: row.descricao ? String(row.descricao) : '',
            categoria: row.categoria ? String(row.categoria) : '',
            unidade_medida: row.unidade_medida || 'UN',
            
            // Dados Fiscais
            ncm: String(row.ncm).replace(/\D/g, ''),
            cest: row.cest ? String(row.cest) : '',
            cfop_entrada: '',
            cfop_saida: '',
            origem_mercadoria: [0, 1, 2, 3, 4, 5, 6, 7, 8].includes(Number(row.origem_mercadoria)) 
              ? Number(row.origem_mercadoria) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
              : 0,
            
            // ICMS - valores padrão (definidos por Regras Tributárias)
            cst_icms: '',
            csosn_icms: '',
            aliquota_icms: 0,
            reducao_bc_icms: 0,
            
            // Substituição Tributária - valores padrão
            cst_icms_st: '',
            mva_st: 0,
            aliquota_icms_st: 0,
            reducao_bc_icms_st: 0,
            
            // PIS/COFINS - valores padrão
            cst_pis: '',
            aliquota_pis: 0,
            cst_cofins: '',
            aliquota_cofins: 0,
            
            // IPI - valores padrão
            cst_ipi: '',
            aliquota_ipi: 0,
            enquadramento_ipi: '',
            
            // Regime - valor padrão
            regime_tributario: 'SIMPLES',
            
            // Comercial
            preco_custo: Number(row.preco_custo) || 0,
            preco_venda: Number(row.preco_venda) || 0,
            margem_lucro: Number(row.margem_lucro) || 0,
            permite_desconto: parseBoolean(row.permite_desconto),
            desconto_maximo: Number(row.desconto_maximo) || 0,
            
            // Estoque
            estoque_atual: Number(row.estoque_atual) || 0,
            estoque_minimo: Number(row.estoque_minimo) || 0,
            estoque_maximo: Number(row.estoque_maximo) || 0,
            localizacao: row.localizacao ? String(row.localizacao) : '',
            
            // Controles
            controla_lote: parseBoolean(row.controla_lote),
            controla_serie: parseBoolean(row.controla_serie),
            controla_validade: parseBoolean(row.controla_validade),
            dias_validade: row.dias_validade ? Number(row.dias_validade) : undefined,
            
            // Status
            ativo: row.ativo !== undefined ? parseBoolean(row.ativo) : true,
            observacoes: row.observacoes ? String(row.observacoes) : ''
          }

          produtos.push({ data: produto, linha, nome: String(row.nome) })
        } catch (error) {
          erros.push({ 
            linha, 
            produto: row.nome || 'Produto sem nome', 
            erro: `Erro ao processar: ${error}` 
          })
        }
      })

      // Importar produtos válidos um por um com progresso
      if (produtos.length > 0) {
        for (let i = 0; i < produtos.length; i++) {
          const { data, linha, nome } = produtos[i]
          
          try {
            // Atualizar progresso
            setProgress({ current: i + 1, total: produtos.length })
            
            // Tentar importar o produto
            await onImport([data])
            produtosImportados.push(nome)
            
            // Pequeno delay para dar tempo de atualizar o progresso
            await new Promise(resolve => setTimeout(resolve, 100))
            
          } catch (error: any) {
            console.error('Erro ao importar produto:', nome, error)
            const errorMessage = error?.message || String(error) || 'Erro desconhecido'
            erros.push({ 
              linha, 
              produto: nome, 
              erro: `Falha ao salvar no banco: ${errorMessage}` 
            })
          }
        }
        
        setResult({
          sucesso: produtosImportados.length,
          erros,
          produtosImportados
        })
        
        // Recarregar lista de produtos se houver callback
        if (onComplete && produtosImportados.length > 0) {
          onComplete()
        }
      } else {
        setResult({
          sucesso: 0,
          erros: erros.length > 0 ? erros : [{ linha: 0, produto: 'Geral', erro: 'Nenhum produto válido encontrado na planilha' }],
          produtosImportados: []
        })
      }

    } catch (error) {
      console.error('Erro ao processar planilha:', error)
      erros.push({ 
        linha: 0, 
        produto: 'Geral', 
        erro: `Erro ao processar arquivo: ${error}` 
      })
      setResult({ sucesso: 0, erros, produtosImportados: [] })
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b" style={{borderColor: '#C9C4B5'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" style={{color: '#394353'}} />
              Importar Produtos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {loading ? (
            <>
              {/* Barra de Progresso */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Importando produtos...
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      backgroundColor: '#394353'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Por favor, aguarde enquanto processamos os produtos...
                </p>
              </div>
            </>
          ) : !result ? (
            <>
              {/* Instruções */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Como importar produtos
                    </h3>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Baixe a planilha modelo clicando no botão abaixo</li>
                      <li>Preencha os dados dos produtos na planilha</li>
                      <li>Salve o arquivo no formato .xlsx</li>
                      <li>Faça o upload do arquivo preenchido</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2 font-medium">
                      ℹ️ A tributação (ICMS, PIS, COFINS) é definida automaticamente pelas Regras Tributárias
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Download Modelo */}
              <div className="mb-6">
                <button
                  onClick={handleDownloadExemplo}
                  className="w-full py-3 px-4 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  style={{borderColor: '#C9C4B5'}}
                >
                  <Download className="w-5 h-5" style={{color: '#394353'}} />
                  <span className="text-sm font-semibold" style={{color: '#394353'}}>
                    Baixar Planilha Modelo
                  </span>
                </button>
              </div>

              {/* Upload de Arquivo */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Selecionar Arquivo
                </label>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 px-4 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors"
                    style={{borderColor: '#C9C4B5'}}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{color: '#394353'}} />
                    {file ? (
                      <div className="text-sm font-medium text-gray-900">
                        {file.name}
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          Clique para selecionar
                        </div>
                        <div className="text-xs text-gray-500">
                          Formato: .xlsx ou .xls
                        </div>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Resultado da Importação */}
              <div className="mb-6 space-y-4">
                {/* Resumo Geral */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="text-sm font-semibold text-green-900">Sucesso</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {result.sucesso}
                    </p>
                    <p className="text-xs text-green-700">
                      {result.sucesso === 1 ? 'produto importado' : 'produtos importados'}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h4 className="text-sm font-semibold text-red-900">Erros</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {result.erros.length}
                    </p>
                    <p className="text-xs text-red-700">
                      {result.erros.length === 1 ? 'falha encontrada' : 'falhas encontradas'}
                    </p>
                  </div>
                </div>

                {/* Lista de Produtos Importados */}
                {result.produtosImportados.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Produtos importados com sucesso
                    </h3>
                    <div className="max-h-40 overflow-y-auto">
                      <ul className="text-xs text-green-800 space-y-1">
                        {result.produtosImportados.map((produto, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                            {produto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Lista de Erros Detalhados */}
                {result.erros.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Produtos com erro
                    </h3>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {result.erros.map((erro, index) => (
                          <div key={index} className="bg-white rounded p-2 border border-red-200">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-mono text-red-600 font-semibold mt-0.5">
                                Linha {erro.linha}:
                              </span>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-red-900">{erro.produto}</p>
                                <p className="text-xs text-red-700 mt-0.5">{erro.erro}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t" style={{borderColor: '#C9C4B5'}}>
          <div className="flex justify-end gap-3">
            {!result ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center gap-2"
                  style={{backgroundColor: '#394353'}}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar Produtos
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90"
                style={{backgroundColor: '#394353'}}
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
