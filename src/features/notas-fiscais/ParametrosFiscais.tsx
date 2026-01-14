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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar a primeira empresa do usuário através do email
      const { data: colaborador } = await supabase
        .from('colaboradores')
        .select('empresa_id')
        .eq('email', user.email)
        .limit(1)
        .single()

      if (colaborador) {
        setEmpresaId(colaborador.empresa_id)
        console.log('Empresa ID carregado:', colaborador.empresa_id)
      } else {
        // Se não encontrou, pega a primeira empresa disponível
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .limit(1)
          .single()
        
        if (empresa) {
          setEmpresaId(empresa.id)
          console.log('Empresa ID carregado (fallback):', empresa.id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresa:', error)
      // Em caso de erro, tenta pegar a primeira empresa
      try {
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .limit(1)
          .single()
        
        if (empresa) {
          setEmpresaId(empresa.id)
        }
      } catch (err) {
        console.error('Erro ao carregar empresa fallback:', err)
      }
    }
  }

  // Carregar parâmetros
  useEffect(() => {
    carregarParametros()
  }, [])

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

  const salvarParametros = async () => {
    setCarregando(true)
    try {
      const { error } = await supabase
        .from('parametros_fiscais')
        .upsert(parametros)

      if (error) throw error

      setToast({ tipo: 'success', mensagem: 'Parâmetros salvos com sucesso!' })
    } catch (error) {
      setToast({ tipo: 'error', mensagem: error instanceof Error ? error.message : 'Erro ao salvar' })
    } finally {
      setCarregando(false)
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
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados da Empresa</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={parametros.cnpj}
                    onChange={(e) => setParametros({ ...parametros, cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={14}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Inscrição Estadual *
                  </label>
                  <input
                    type="text"
                    value={parametros.inscricao_estadual}
                    onChange={(e) => setParametros({ ...parametros, inscricao_estadual: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Regime Tributário *
                  </label>
                  <select
                    value={parametros.regime_tributario}
                    onChange={(e) => setParametros({ ...parametros, regime_tributario: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Simples Nacional</option>
                    <option value="2">Simples Nacional - Excesso</option>
                    <option value="3">Regime Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CRT - Código de Regime Tributário *
                  </label>
                  <select
                    value={parametros.crt}
                    onChange={(e) => setParametros({ ...parametros, crt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Simples Nacional</option>
                    <option value="2">Simples Nacional - Excesso</option>
                    <option value="3">Regime Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    value={parametros.uf}
                    onChange={(e) => setParametros({ ...parametros, uf: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código IBGE do Município *
                  </label>
                  <input
                    type="text"
                    value={parametros.codigo_municipio}
                    onChange={(e) => setParametros({ ...parametros, codigo_municipio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={7}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ambiente *
                  </label>
                  <select
                    value={parametros.ambiente}
                    onChange={(e) => setParametros({ ...parametros, ambiente: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HOMOLOGACAO">Homologação</option>
                    <option value="PRODUCAO">Produção</option>
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Estes dados serão utilizados para identificar o emitente nas notas fiscais. Certifique-se de que estão corretos.
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={salvarParametros}
                  disabled={carregando}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {carregando ? 'Salvando...' : 'Salvar Parâmetros'}
                </button>
              </div>
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

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-3">NF-e (Modelo 55)</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Série NF-e
                      </label>
                      <input
                        type="number"
                        value={parametros.serie_nfe}
                        onChange={(e) => setParametros({ ...parametros, serie_nfe: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Próximo Número
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100"
                        disabled
                        placeholder="Será obtido automaticamente"
                      />
                      <p className="text-xs text-slate-500 mt-1">Controlado automaticamente pelo sistema</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-3">NFC-e (Modelo 65)</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Série NFC-e
                      </label>
                      <input
                        type="number"
                        value={parametros.serie_nfce}
                        onChange={(e) => setParametros({ ...parametros, serie_nfce: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Próximo Número
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100"
                        disabled
                        placeholder="Será obtido automaticamente"
                      />
                      <p className="text-xs text-slate-500 mt-1">Controlado automaticamente pelo sistema</p>
                    </div>
                  </div>
                </div>
              </div>

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
                  onClick={salvarParametros}
                  disabled={carregando}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400"
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
