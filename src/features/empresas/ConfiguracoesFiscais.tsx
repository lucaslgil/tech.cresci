// =====================================================
// CONFIGURAÇÕES FISCAIS DA EMPRESA
// Gerencia informações complementares e responsável técnico
// Data: 06/02/2026
// =====================================================

import { useState, useEffect } from 'react'
import { Save, AlertCircle, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Toast } from '../../shared/components/Toast'

interface ConfiguracaoFiscal {
  informacoes_complementares_padrao?: string
  resp_tec_cnpj?: string
  resp_tec_nome?: string
  resp_tec_email?: string
  resp_tec_telefone?: string
}

interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function ConfiguracoesFiscais() {
  const [config, setConfig] = useState<ConfiguracaoFiscal>({})
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  const carregarConfiguracoes = async () => {
    try {
      // Buscar primeira empresa cadastrada
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select('id, informacoes_complementares_padrao, resp_tec_cnpj, resp_tec_nome, resp_tec_email, resp_tec_telefone')
        .limit(1)

      if (error) throw error

      if (empresas && empresas.length > 0) {
        const empresa = empresas[0]
        setEmpresaId(empresa.id)
        setConfig({
          informacoes_complementares_padrao: empresa.informacoes_complementares_padrao || '',
          resp_tec_cnpj: empresa.resp_tec_cnpj || '',
          resp_tec_nome: empresa.resp_tec_nome || '',
          resp_tec_email: empresa.resp_tec_email || '',
          resp_tec_telefone: empresa.resp_tec_telefone || ''
        })
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error)
      setToast({ type: 'error', message: 'Erro ao carregar configurações fiscais' })
    } finally {
      setLoading(false)
    }
  }

  const salvar = async () => {
    if (!empresaId) {
      setToast({ type: 'error', message: 'Nenhuma empresa cadastrada' })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          informacoes_complementares_padrao: config.informacoes_complementares_padrao || null,
          resp_tec_cnpj: config.resp_tec_cnpj || null,
          resp_tec_nome: config.resp_tec_nome || null,
          resp_tec_email: config.resp_tec_email || null,
          resp_tec_telefone: config.resp_tec_telefone || null
        })
        .eq('id', empresaId)

      if (error) throw error

      setToast({ type: 'success', message: '✅ Configurações salvas com sucesso!' })
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      setToast({ type: 'error', message: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border" style={{ borderColor: '#C9C4B5' }}>
          {/* Cabeçalho */}
          <div className="px-6 py-4 border-b" style={{ backgroundColor: '#394353', borderColor: '#C9C4B5' }}>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-white" />
              <h1 className="text-base font-semibold text-white">
                Configurações Fiscais da Empresa
              </h1>
            </div>
          </div>

          {/* Alerta Informativo */}
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Sobre os Dados do Responsável Técnico</p>
                <p className="text-xs leading-relaxed">
                  Os dados do <strong>Responsável Técnico (infRespTec)</strong> são configurados diretamente na 
                  sua conta da <strong>Nuvem Fiscal</strong>. Para alterar essas informações, acesse o painel 
                  da Nuvem Fiscal e configure os dados da sua empresa/software house.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="p-6 space-y-6">
            {/* Informações Complementares Padrão */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Informações Complementares Padrão
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Texto que será automaticamente incluído no campo "Informações Complementares" de todas as notas fiscais.
              </p>
              <textarea
                value={config.informacoes_complementares_padrao || ''}
                onChange={(e) => setConfig({ ...config, informacoes_complementares_padrao: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#C9C4B5' }}
                rows={4}
                placeholder="Ex: Nota emitida conforme Lei 12.741/2012..."
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {config.informacoes_complementares_padrao?.length || 0} / 5000 caracteres
              </p>
            </div>

            {/* Divider */}
            <div className="border-t pt-6" style={{ borderColor: '#C9C4B5' }}>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Dados do Responsável Técnico (Opcional)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Preencha apenas se desejar registrar dados do desenvolvedor/software house (não obrigatório).
              </p>
            </div>

            {/* CNPJ do Responsável Técnico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  CNPJ do Responsável Técnico
                </label>
                <input
                  type="text"
                  value={config.resp_tec_cnpj || ''}
                  onChange={(e) => setConfig({ ...config, resp_tec_cnpj: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  value={config.resp_tec_nome || ''}
                  onChange={(e) => setConfig({ ...config, resp_tec_nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="Nome da empresa"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email de Contato
                </label>
                <input
                  type="email"
                  value={config.resp_tec_email || ''}
                  onChange={(e) => setConfig({ ...config, resp_tec_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="contato@empresa.com"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={config.resp_tec_telefone || ''}
                  onChange={(e) => setConfig({ ...config, resp_tec_telefone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: '#C9C4B5' }}
                  placeholder="(11) 98765-4321"
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          {/* Rodapé com botões */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: '#C9C4B5' }}>
            <button
              onClick={salvar}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#394353' }}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Importante sobre o Responsável Técnico</p>
              <p className="text-xs leading-relaxed">
                Os dados que aparecem no XML (<code>infRespTec</code>) são configurados na 
                <strong> conta da Nuvem Fiscal</strong>, não nesta tela. Para alterar:
              </p>
              <ol className="list-decimal ml-4 mt-2 text-xs space-y-1">
                <li>Acesse <a href="https://sandbox.nuvemfiscal.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">sandbox.nuvemfiscal.com.br</a></li>
                <li>Vá em <strong>Configurações → Responsável Técnico</strong></li>
                <li>Atualize os dados do seu CNPJ/software house</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
