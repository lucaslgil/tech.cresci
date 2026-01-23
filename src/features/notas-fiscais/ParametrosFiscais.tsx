// =====================================================
// COMPONENTE - PARÂMETROS FISCAIS
// Configurações fiscais e cadastros de apoio
// Data: 01/12/2025
// =====================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Toast } from '../../shared/components/Toast'
import { CadastroNCM, CadastroCFOP, CadastroOperacoesFiscais, CadastroUnidadesMedida, CadastroICMSST, CadastroTiposContribuinte } from '../cadastros-fiscais'
import RegrasTributacao from './RegrasTributacao'

interface ParametrosFiscais {
  id?: number
  cnpj: string
  inscricao_estadual: string
  regime_tributario: string
  crt: string
  uf: string
  codigo_municipio: string
  serie_nfe: number
  serie_nfce: number
  ambiente: 'HOMOLOGACAO' | 'PRODUCAO'
  csc_homologacao?: string
  id_csc_homologacao?: string
  csc_producao?: string
  id_csc_producao?: string
}

export default function ParametrosFiscais() {
  const [abaAtiva, setAbaAtiva] = useState<'empresa' | 'certificado' | 'numeracao' | 'cadastros' | 'regras'>('empresa')
  const [carregando, setCarregando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [modalAberto, setModalAberto] = useState<'ncm' | 'cfop' | 'operacoes' | 'unidades' | 'icmsst' | 'tipos-contribuinte' | null>(null)
  const [empresaId, setEmpresaId] = useState<number | null>(null)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<any | null>(null)

  // Estados para controle de numeração
  const [numeracaoNfe, setNumeracaoNfe] = useState({ serie: 1, ultimo_numero: 0, automatico: true })
  const [numeracaoNfce, setNumeracaoNfce] = useState({ serie: 1, ultimo_numero: 0, automatico: true })
  const [carregandoNumeracao, setCarregandoNumeracao] = useState(false)

  const [parametros, setParametros] = useState<ParametrosFiscais>({
    cnpj: '',
    inscricao_estadual: '',
    regime_tributario: '1',
    crt: '3',
    uf: '',
    codigo_municipio: '',
    serie_nfe: 1,
    serie_nfce: 1,
    ambiente: 'HOMOLOGACAO'
  })

  // Carregar empresa do usuário
  useEffect(() => {
    carregarEmpresa()
  }, [])

  const carregarEmpresa = async () => {
    try {
      // Carregar todas as empresas ativas
      const { data: empresasData, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)
        .order('empresa_padrao_nfe', { ascending: false })
        .order('nome_fantasia')

      if (error) throw error

      setEmpresas(empresasData || [])

      // Buscar empresa padrão ou primeira empresa
      const empresaPadrao = empresasData?.find(e => e.empresa_padrao_nfe === true)
      const empresaParaSelecionar = empresaPadrao || empresasData?.[0]

      if (empresaParaSelecionar) {
        setEmpresaId(empresaParaSelecionar.id)
        setEmpresaSelecionada(empresaParaSelecionar)
        console.log('Empresa selecionada:', empresaParaSelecionar.nome_fantasia)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar empresas' })
    }
  }

  // Carregar parâmetros
  useEffect(() => {
    carregarParametros()
    carregarNumeracao()
  }, [])

  const carregarNumeracao = async () => {
    try {
      setCarregandoNumeracao(true)
      
      // Buscar numeração NFe
      const { data: nfe } = await supabase
        .from('notas_fiscais_numeracao')
        .select('*')
        .eq('tipo_nota', 'NFE')
        .eq('serie', 1)
        .eq('ambiente', 'HOMOLOGACAO')
        .maybeSingle()
      
      if (nfe) {
        setNumeracaoNfe({
          serie: nfe.serie,
          ultimo_numero: nfe.ultimo_numero,
          automatico: nfe.ativo
        })
      }

      // Buscar numeração NFCe
      const { data: nfce } = await supabase
        .from('notas_fiscais_numeracao')
        .select('*')
        .eq('tipo_nota', 'NFCE')
        .eq('serie', 1)
        .eq('ambiente', 'HOMOLOGACAO')
        .maybeSingle()
      
      if (nfce) {
        setNumeracaoNfce({
          serie: nfce.serie,
          ultimo_numero: nfce.ultimo_numero,
          automatico: nfce.ativo
        })
      }
    } catch (error) {
      console.error('Erro ao carregar numeração:', error)
    } finally {
      setCarregandoNumeracao(false)
    }
  }

  const salvarNumeracao = async () => {
    try {
      setCarregando(true)

      // Atualizar NFe
      const { error: erroNfe } = await supabase
        .from('notas_fiscais_numeracao')
        .update({
          ultimo_numero: numeracaoNfe.ultimo_numero,
          ativo: numeracaoNfe.automatico,
          updated_at: new Date().toISOString()
        })
        .eq('tipo_nota', 'NFE')
        .eq('serie', numeracaoNfe.serie)
        .eq('ambiente', 'HOMOLOGACAO')

      if (erroNfe) throw erroNfe

      // Atualizar NFCe
      const { error: erroNfce } = await supabase
        .from('notas_fiscais_numeracao')
        .update({
          ultimo_numero: numeracaoNfce.ultimo_numero,
          ativo: numeracaoNfce.automatico,
          updated_at: new Date().toISOString()
        })
        .eq('tipo_nota', 'NFCE')
        .eq('serie', numeracaoNfce.serie)
        .eq('ambiente', 'HOMOLOGACAO')

      if (erroNfce) throw erroNfce

      setToast({ tipo: 'success', mensagem: 'Numeração atualizada com sucesso!' })
      await carregarNumeracao()
    } catch (error) {
      console.error('Erro ao salvar numeração:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao salvar numeração' })
    } finally {
      setCarregando(false)
    }
  }

  const carregarParametros = async () => {
    try {
      const { data, error } = await supabase
        .from('parametros_fiscais')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setParametros(data)
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Parâmetros Fiscais</h1>
        <p className="text-slate-600 mt-2">
          Configurações gerais para emissão de notas fiscais
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-slate-200">
          <nav className="flex gap-8 px-6">
            {[
              { id: 'empresa', label: 'Dados da Empresa' },
              { id: 'certificado', label: 'Certificado Digital' },
              { id: 'numeracao', label: 'Numeração' },
              { id: 'regras', label: 'Regras de Tributação' },
              { id: 'cadastros', label: 'Cadastros Auxiliares' }
            ].map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as any)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  abaAtiva === aba.id
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                {aba.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Aba: Dados da Empresa */}
          {abaAtiva === 'empresa' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados da Empresa Emissora</h2>

              {/* Seletor de Empresa */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  🏢 Selecione a Empresa
                </label>
                <select
                  value={empresaSelecionada?.id || ''}
                  onChange={(e) => {
                    const empresa = empresas.find(emp => emp.id === Number(e.target.value))
                    setEmpresaSelecionada(empresa || null)
                    setEmpresaId(empresa?.id || null)
                  }}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                >
                  <option value="">Selecione uma empresa...</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.empresa_padrao_nfe ? '⭐ ' : ''}{empresa.nome_fantasia || empresa.razao_social} - {empresa.cnpj}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-700 mt-2">
                  💡 A empresa com ⭐ é a padrão para emissão de NF-e
                </p>
              </div>

              {empresaSelecionada ? (
                <>
                  {/* Dados da Empresa (Modo Leitura) */}
                  <div className="bg-white border-2 border-[#C9C4B5] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-semibold text-slate-800">Dados Cadastrais</h3>
                      <a
                        href="/cadastro/empresa"
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar no Cadastro
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Razão Social</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.razao_social}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nome Fantasia</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.nome_fantasia || '-'}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">CNPJ</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.cnpj}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Inscrição Estadual</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.inscricao_estadual || '-'}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Regime Tributário</label>
                        <p className="text-sm font-semibold text-slate-900">
                          {empresaSelecionada.regime_tributario === 'SIMPLES' ? 'Simples Nacional' :
                           empresaSelecionada.regime_tributario === 'PRESUMIDO' ? 'Lucro Presumido' :
                           empresaSelecionada.regime_tributario === 'REAL' ? 'Lucro Real' : '-'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">CRT</label>
                        <p className="text-sm font-semibold text-slate-900">
                          {empresaSelecionada.crt === '1' ? '1 - Simples Nacional' :
                           empresaSelecionada.crt === '2' ? '2 - Simples Excesso' :
                           empresaSelecionada.crt === '3' ? '3 - Regime Normal' : '-'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">UF</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.estado || '-'}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Código Município (IBGE)</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.codigo_municipio || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status de NF-e */}
                  <div className="bg-white border-2 border-[#C9C4B5] rounded-lg p-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-4">Configurações de NF-e</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Emite NF-e</label>
                        <p className="text-sm font-semibold">
                          {empresaSelecionada.emite_nfe ? (
                            <span className="text-green-600">✅ Sim</span>
                          ) : (
                            <span className="text-red-600">❌ Não</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Empresa Padrão</label>
                        <p className="text-sm font-semibold">
                          {empresaSelecionada.empresa_padrao_nfe ? (
                            <span className="text-amber-600">⭐ Sim</span>
                          ) : (
                            <span className="text-slate-600">Não</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Série NF-e</label>
                        <p className="text-sm font-semibold text-slate-900">{empresaSelecionada.serie_nfe || '1'}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ambiente</label>
                        <p className="text-sm font-semibold">
                          {empresaSelecionada.ambiente_nfe === 'PRODUCAO' ? (
                            <span className="text-green-600">🟢 Produção</span>
                          ) : (
                            <span className="text-yellow-600">🟡 Homologação</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Dica:</strong> Para alterar os dados da empresa, clique em "Editar no Cadastro" acima. Essas informações são usadas como fonte única de verdade para emissão de notas fiscais.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm text-slate-600 mb-4">Nenhuma empresa selecionada</p>
                  <a
                    href="/cadastro/empresa"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-md hover:opacity-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Cadastrar Empresa
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Aba: Certificado Digital */}
          {abaAtiva === 'certificado' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Certificado Digital</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Sobre o Certificado Digital</h3>
                <p className="text-sm text-blue-800">
                  O certificado digital é obrigatório para assinar as notas fiscais eletrônicas antes de enviá-las à SEFAZ.
                  Você pode utilizar certificados tipo A1 (arquivo .pfx/.p12) ou A3 (smartcard/token USB).
                </p>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Certificado
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    <option value="A1">A1 - Arquivo (.pfx/.p12)</option>
                    <option value="A3">A3 - Smartcard/Token USB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Arquivo do Certificado (.pfx/.p12)
                  </label>
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Selecione o arquivo do certificado digital A1</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Senha do Certificado
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a senha do certificado"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Segurança:</strong> A senha do certificado não é armazenada. Será solicitada a cada assinatura.
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Validar e Salvar Certificado
                </button>
              </div>
            </div>
          )}

          {/* Aba: Numeração */}
          {abaAtiva === 'numeracao' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Configuração de Numeração</h2>

              {carregandoNumeracao ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Carregando numeração...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    {/* NF-e */}
                    <div className="bg-slate-50 p-4 rounded-md border border-[#C9C4B5]">
                      <h3 className="font-semibold text-slate-700 mb-3">NF-e (Modelo 55)</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Série NF-e
                          </label>
                          <input
                            type="number"
                            value={numeracaoNfe.serie}
                            onChange={(e) => setNumeracaoNfe({ ...numeracaoNfe, serie: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:ring-2 focus:ring-[#394353]"
                            min="1"
                            max="999"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Controle de Numeração
                          </label>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-[#C9C4B5]">
                            <button
                              onClick={() => setNumeracaoNfe({ ...numeracaoNfe, automatico: !numeracaoNfe.automatico })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                numeracaoNfe.automatico ? 'bg-green-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  numeracaoNfe.automatico ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-semibold text-slate-700">
                                {numeracaoNfe.automatico ? 'Automático' : 'Manual'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {numeracaoNfe.automatico 
                                  ? 'Sistema incrementa automaticamente' 
                                  : 'Permite alterar manualmente'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Último Número Emitido
                          </label>
                          <input
                            type="number"
                            value={numeracaoNfe.ultimo_numero}
                            onChange={(e) => setNumeracaoNfe({ ...numeracaoNfe, ultimo_numero: parseInt(e.target.value) || 0 })}
                            disabled={numeracaoNfe.automatico}
                            className={`w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:ring-2 focus:ring-[#394353] ${
                              numeracaoNfe.automatico ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                            }`}
                            min="0"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Próximo número: <strong className="text-[#394353]">{numeracaoNfe.ultimo_numero + 1}</strong>
                          </p>
                        </div>

                        {!numeracaoNfe.automatico && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                            <div className="flex gap-2">
                              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div className="text-xs text-amber-800">
                                <strong>Atenção:</strong> Altere este número apenas se necessário. Números duplicados podem causar rejeição pela SEFAZ.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NFC-e */}
                    <div className="bg-slate-50 p-4 rounded-md border border-[#C9C4B5]">
                      <h3 className="font-semibold text-slate-700 mb-3">NFC-e (Modelo 65)</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Série NFC-e
                          </label>
                          <input
                            type="number"
                            value={numeracaoNfce.serie}
                            onChange={(e) => setNumeracaoNfce({ ...numeracaoNfce, serie: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:ring-2 focus:ring-[#394353]"
                            min="1"
                            max="999"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Controle de Numeração
                          </label>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-md border border-[#C9C4B5]">
                            <button
                              onClick={() => setNumeracaoNfce({ ...numeracaoNfce, automatico: !numeracaoNfce.automatico })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                numeracaoNfce.automatico ? 'bg-green-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  numeracaoNfce.automatico ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-semibold text-slate-700">
                                {numeracaoNfce.automatico ? 'Automático' : 'Manual'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {numeracaoNfce.automatico 
                                  ? 'Sistema incrementa automaticamente' 
                                  : 'Permite alterar manualmente'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Último Número Emitido
                          </label>
                          <input
                            type="number"
                            value={numeracaoNfce.ultimo_numero}
                            onChange={(e) => setNumeracaoNfce({ ...numeracaoNfce, ultimo_numero: parseInt(e.target.value) || 0 })}
                            disabled={numeracaoNfce.automatico}
                            className={`w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded-md focus:ring-2 focus:ring-[#394353] ${
                              numeracaoNfce.automatico ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                            }`}
                            min="0"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Próximo número: <strong className="text-[#394353]">{numeracaoNfce.ultimo_numero + 1}</strong>
                          </p>
                        </div>

                        {!numeracaoNfce.automatico && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                            <div className="flex gap-2">
                              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div className="text-xs text-amber-800">
                                <strong>Atenção:</strong> Altere este número apenas se necessário. Números duplicados podem causar rejeição pela SEFAZ.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Como funciona o controle de numeração:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Automático:</strong> O sistema incrementa o número automaticamente a cada emissão</li>
                          <li><strong>Manual:</strong> Permite alterar o último número emitido caso precise reiniciar ou ajustar a sequência</li>
                          <li>Útil para migração de outros sistemas ou correção de sequência</li>
                          <li>O próximo número sempre será o último número + 1</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-6">
                <h3 className="font-semibold text-slate-700 mb-3">CSC - Código de Segurança do Contribuinte</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ID CSC Homologação
                    </label>
                    <input
                      type="text"
                      value={parametros.id_csc_homologacao || ''}
                      onChange={(e) => setParametros({ ...parametros, id_csc_homologacao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      CSC Homologação
                    </label>
                    <input
                      type="password"
                      value={parametros.csc_homologacao || ''}
                      onChange={(e) => setParametros({ ...parametros, csc_homologacao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ID CSC Produção
                    </label>
                    <input
                      type="text"
                      value={parametros.id_csc_producao || ''}
                      onChange={(e) => setParametros({ ...parametros, id_csc_producao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      CSC Produção
                    </label>
                    <input
                      type="password"
                      value={parametros.csc_producao || ''}
                      onChange={(e) => setParametros({ ...parametros, csc_producao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  O CSC é usado para gerar o QR Code da NFC-e. Obtenha estes códigos no portal da SEFAZ do seu estado.
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={salvarNumeracao}
                  disabled={carregando}
                  className="px-6 py-2 bg-[#394353] text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:bg-slate-400"
                >
                  {carregando ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          )}

          {/* Aba: Regras de Tributação */}
          {abaAtiva === 'regras' && (
            <div>
              {empresaId ? (
                <RegrasTributacao empresaId={empresaId} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600">Carregando informações da empresa...</p>
                </div>
              )}
            </div>
          )}

          {/* Aba: Cadastros Auxiliares */}
          {abaAtiva === 'cadastros' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Cadastros Auxiliares</h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setModalAberto('ncm')}
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800">NCM</h3>
                  <p className="text-sm text-slate-600 mt-1">Nomenclatura Comum do Mercosul</p>
                </button>

                <button
                  onClick={() => setModalAberto('cfop')}
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800">CFOP</h3>
                  <p className="text-sm text-slate-600 mt-1">Código Fiscal de Operações e Prestações</p>
                </button>

                <a
                  href="/fiscal/cest"
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-slate-800">CEST</h3>
                  <p className="text-sm text-slate-600 mt-1">Código Especificador da Substituição Tributária</p>
                </a>

                <button
                  onClick={() => setModalAberto('operacoes')}
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800">Operações Fiscais</h3>
                  <p className="text-sm text-slate-600 mt-1">Regras de tributação por tipo de operação</p>
                </button>

                <a
                  href="/fiscal/categorias"
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-slate-800">Categorias de Produtos</h3>
                  <p className="text-sm text-slate-600 mt-1">Agrupamento de produtos por categoria</p>
                </a>

                <button
                  onClick={() => setModalAberto('unidades')}
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800">Unidades de Medida</h3>
                  <p className="text-sm text-slate-600 mt-1">Unidades comerciais e tributárias</p>
                </button>

                <a
                  href="/fiscal/ibpt"
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-slate-800">Tabela IBPT</h3>
                  <p className="text-sm text-slate-600 mt-1">Tributos aproximados por NCM</p>
                </a>

                <button
                  onClick={() => setModalAberto('icmsst')}
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800">ICMS-ST por UF</h3>
                  <p className="text-sm text-slate-600 mt-1">MVA e alíquotas por par UF/NCM</p>
                </button>

                <a
                  href="/fiscal/icms-uf"
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-slate-800">Regras ICMS/ST</h3>
                  <p className="text-sm text-slate-600 mt-1">Alíquotas e MVA por UF</p>
                </a>

                <button
                  onClick={() => setModalAberto('tipos-contribuinte')}
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800">Tipo de Contribuinte</h3>
                  <p className="text-sm text-slate-600 mt-1">Perfis fiscais para clientes</p>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                <h3 className="font-semibold text-blue-900 mb-2">Gerenciar Cadastros</h3>
                <p className="text-sm text-blue-800">
                  Os cadastros auxiliares centralizam informações fiscais que serão utilizadas automaticamente na emissão de notas e no cadastro de produtos.
                  Clique em cada card acima para gerenciar os respectivos cadastros.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.tipo}
          message={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modais dos Cadastros Auxiliares */}
      {modalAberto === 'ncm' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">NCM - Nomenclatura Comum do Mercosul</h2>
              <button
                onClick={() => setModalAberto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CadastroNCM />
            </div>
          </div>
        </div>
      )}

      {modalAberto === 'cfop' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">CFOP - Código Fiscal de Operações</h2>
              <button
                onClick={() => setModalAberto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CadastroCFOP />
            </div>
          </div>
        </div>
      )}

      {modalAberto === 'operacoes' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Operações Fiscais</h2>
              <button
                onClick={() => setModalAberto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CadastroOperacoesFiscais />
            </div>
          </div>
        </div>
      )}

      {modalAberto === 'unidades' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Unidades de Medida</h2>
              <button
                onClick={() => setModalAberto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CadastroUnidadesMedida />
            </div>
          </div>
        </div>
      )}

      {modalAberto === 'icmsst' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">ICMS-ST por UF</h2>
              <button
                onClick={() => setModalAberto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CadastroICMSST />
            </div>
          </div>
        </div>
      )}

      {modalAberto === 'tipos-contribuinte' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Tipos de Contribuinte</h2>
              <button
                onClick={() => setModalAberto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CadastroTiposContribuinte />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
