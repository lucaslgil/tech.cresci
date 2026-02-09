// =====================================================
// MODAL - EDITAR NOTA FISCAL
// Permite editar e retransmitir notas rejeitadas
// Data: 05/02/2026
// Atualização: 06/02/2026 - Consulta de status
// =====================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { criarServicoNFe } from '../../services/nfe/nfeService'
import { notasFiscaisService } from './notasFiscaisService'
import { Toast } from '../../shared/components/Toast'

interface ModalEditarNotaProps {
  notaId: number
  onClose: () => void
  onSucesso: () => void
}

export default function ModalEditarNota({ notaId, onClose, onSucesso }: ModalEditarNotaProps) {
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [transmitindo, setTransmitindo] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null)
  const [nota, setNota] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('')
  const [modalCancelamento, setModalCancelamento] = useState(false)

  useEffect(() => {
    carregarNota()
  }, [notaId])

  const carregarNota = async () => {
    try {
      setCarregando(true)

      // Buscar nota completa
      const { data: notaData, error: notaError } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('id', notaId)
        .single()

      if (notaError) throw notaError

      // Buscar itens da nota
      const { data: itensData, error: itensError } = await supabase
        .from('notas_fiscais_itens')
        .select('*')
        .eq('nota_fiscal_id', notaId)
        .order('numero_item')

      if (itensError) throw itensError

      setNota(notaData)
      setItens(itensData || [])
    } catch (error: any) {
      console.error('Erro ao carregar nota:', error)
      setToast({ tipo: 'error', mensagem: 'Erro ao carregar nota fiscal' })
    } finally {
      setCarregando(false)
    }
  }

  const handleSalvar = async () => {
    try {
      setSalvando(true)

      // Atualizar nota fiscal
      const { error: notaError } = await supabase
        .from('notas_fiscais')
        .update({
          natureza_operacao: nota.natureza_operacao,
          destinatario_nome: nota.destinatario_nome,
          destinatario_cpf_cnpj: nota.destinatario_cpf_cnpj,
          destinatario_ie: nota.destinatario_ie,
          destinatario_email: nota.destinatario_email,
          destinatario_telefone: nota.destinatario_telefone,
          destinatario_logradouro: nota.destinatario_logradouro,
          destinatario_numero: nota.destinatario_numero,
          destinatario_complemento: nota.destinatario_complemento,
          destinatario_bairro: nota.destinatario_bairro,
          destinatario_cidade: nota.destinatario_cidade,
          destinatario_uf: nota.destinatario_uf,
          destinatario_cep: nota.destinatario_cep,
          destinatario_codigo_municipio: nota.destinatario_codigo_municipio,
          modalidade_frete: nota.modalidade_frete,
          forma_pagamento: nota.forma_pagamento,
          informacoes_complementares: nota.informacoes_complementares,
          informacoes_fisco: nota.informacoes_fisco,
          updated_at: new Date().toISOString()
        })
        .eq('id', notaId)

      if (notaError) throw notaError

      // Atualizar itens
      for (const item of itens) {
        const { error: itemError } = await supabase
          .from('notas_fiscais_itens')
          .update({
            codigo_produto: item.codigo_produto,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidade_comercial: item.unidade_comercial,
            quantidade_comercial: item.quantidade_comercial,
            valor_unitario_comercial: item.valor_unitario_comercial,
            cst_icms: item.cst_icms,
            aliquota_icms: item.aliquota_icms,
            base_calculo_icms: item.base_calculo_icms,
            valor_icms: item.valor_icms,
            cst_pis: item.cst_pis,
            aliquota_pis: item.aliquota_pis,
            base_calculo_pis: item.base_calculo_pis,
            valor_pis: item.valor_pis,
            cst_cofins: item.cst_cofins,
            aliquota_cofins: item.aliquota_cofins,
            base_calculo_cofins: item.base_calculo_cofins,
            valor_cofins: item.valor_cofins
          })
          .eq('id', item.id)

        if (itemError) throw itemError
      }

      setToast({ tipo: 'success', mensagem: '✅ Alterações salvas com sucesso!' })
      await carregarNota() // Recarregar dados
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      setToast({ tipo: 'error', mensagem: `Erro ao salvar: ${error.message}` })
    } finally {
      setSalvando(false)
    }
  }

  const handleTransmitir = async () => {
    if (!confirm('Deseja transmitir esta nota fiscal para a SEFAZ?')) return

    try {
      setTransmitindo(true)
      setToast({ tipo: 'success', mensagem: '📤 Transmitindo nota para SEFAZ...' })

      // Buscar empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', nota.empresa_id)
        .single()

      if (empresaError) throw empresaError

      // Preparar dados para emissão
      const dadosNota = {
        numero: nota.numero,
        serie: nota.serie,
        data_emissao: nota.data_emissao,
        emitente: {
          cnpj: empresa.cnpj,
          razao_social: empresa.razao_social,
          nome_fantasia: empresa.nome_fantasia,
          inscricao_estadual: empresa.inscricao_estadual,
          crt: empresa.crt,
          regime_tributario: empresa.regime_tributario,
          logradouro: empresa.logradouro,
          numero: empresa.numero,
          complemento: empresa.complemento,
          bairro: empresa.bairro,
          cidade: empresa.cidade,
          uf: empresa.estado,
          cep: empresa.cep,
          codigo_municipio: empresa.codigo_municipio,
          telefone: empresa.telefone,
          email: empresa.email
        },
        destinatario: {
          cpf_cnpj: nota.destinatario_cpf_cnpj,
          nome: nota.destinatario_nome,
          inscricao_estadual: nota.destinatario_ie,
          email: nota.destinatario_email,
          telefone: nota.destinatario_telefone,
          logradouro: nota.destinatario_logradouro,
          numero: nota.destinatario_numero,
          complemento: nota.destinatario_complemento,
          bairro: nota.destinatario_bairro,
          cidade: nota.destinatario_cidade,
          uf: nota.destinatario_uf,
          cep: nota.destinatario_cep,
          codigo_municipio: nota.destinatario_codigo_municipio
        },
        itens: itens.map(item => ({
          numero_item: item.numero_item,
          codigo_produto: item.codigo_produto,
          descricao: item.descricao,
          ncm: item.ncm,
          cfop: item.cfop,
          unidade_comercial: item.unidade_comercial,
          quantidade_comercial: item.quantidade_comercial,
          valor_unitario_comercial: item.valor_unitario_comercial,
          impostos: {
            icms: {
              cst: item.cst_icms,
              aliquota: item.aliquota_icms,
              base_calculo: item.base_calculo_icms,
              valor: item.valor_icms
            },
            pis: {
              cst: item.cst_pis,
              aliquota: item.aliquota_pis,
              base_calculo: item.base_calculo_pis,
              valor: item.valor_pis
            },
            cofins: {
              cst: item.cst_cofins,
              aliquota: item.aliquota_cofins,
              base_calculo: item.base_calculo_cofins,
              valor: item.valor_cofins
            }
          }
        })),
        natureza_operacao: nota.natureza_operacao,
        modalidade_frete: nota.modalidade_frete,
        forma_pagamento: nota.forma_pagamento,
        informacoes_complementares: nota.informacoes_complementares,
        informacoes_fisco: nota.informacoes_fisco
      }

      // Criar serviço e emitir
      const nfeService = criarServicoNFe({ ambiente: 'HOMOLOGACAO' })
      const resultado = await nfeService.emitir(dadosNota)

      if (resultado.sucesso) {
        setToast({ 
          tipo: 'success', 
          mensagem: `✅ NF-e AUTORIZADA!\nChave: ${resultado.retorno.chaveAcesso}` 
        })
        setTimeout(() => {
          onSucesso()
          onClose()
        }, 2000)
      } else {
        setToast({ 
          tipo: 'error', 
          mensagem: `❌ Nota REJEITADA:\n${resultado.retorno.mensagem}` 
        })
        await carregarNota() // Recarregar para ver novo status
      }
    } catch (error: any) {
      console.error('Erro ao transmitir:', error)
      setToast({ tipo: 'error', mensagem: `Erro: ${error.message}` })
    } finally {
      setTransmitindo(false)
    }
  }

  const handleCancelar = async () => {
    if (!justificativaCancelamento || justificativaCancelamento.length < 15) {
      setToast({ tipo: 'error', mensagem: 'Justificativa deve ter no minimo 15 caracteres' })
      return
    }

    try {
      setCancelando(true)
      setToast({ tipo: 'success', mensagem: 'Cancelando nota fiscal...' })

      // Usar notasFiscaisService que ja tem toda a logica
      const resultado = await notasFiscaisService.cancelar(notaId, justificativaCancelamento)

      if (resultado.sucesso) {
        setToast({ 
          tipo: 'success', 
          mensagem: `NF-e CANCELADA com sucesso! Protocolo: ${resultado.protocolo}` 
        })
        
        // Recarregar nota para atualizar status
        await carregarNota()
        
        setTimeout(() => {
          onSucesso()
          onClose()
        }, 3000)
      } else {
        setToast({ tipo: 'error', mensagem: `Erro ao cancelar: ${resultado.mensagem}` })
      }
    } catch (error: any) {
      console.error('Erro ao cancelar:', error)
      setToast({ tipo: 'error', mensagem: `Erro: ${error.message}` })
    } finally {
      setCancelando(false)
      setModalCancelamento(false)
    }
  }

  const handleConsultarStatus = async () => {
    try {
      setConsultando(true)
      setToast({ tipo: 'success', mensagem: 'Consultando status na SEFAZ...' })

      const resultado = await notasFiscaisService.consultarStatusSEFAZ(notaId)

      console.log('📊 Resultado da consulta:', resultado)

      if (resultado.atualizado) {
        // Status foi alterado
        setToast({ 
          tipo: 'success', 
          mensagem: `Status atualizado de ${resultado.statusAnterior} para ${resultado.statusAtual}! Atualizando tela...` 
        })

        // Aguardar um pouco para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 500))

        // Recarregar nota
        await carregarNota()

        // Atualizar lista de notas também
        onSucesso()

        // Fechar modal após 2 segundos se foi cancelada
        if (resultado.statusAtual === 'CANCELADA') {
          setTimeout(() => {
            onClose()
          }, 2000)
        }
      } else {
        // Status já estava correto
        setToast({ 
          tipo: 'success', 
          mensagem: `Status confirmado na SEFAZ: ${resultado.statusAtual}` 
        })

        // Recarregar nota mesmo assim para garantir
        await carregarNota()
      }
      
    } catch (error: any) {
      console.error('Erro ao consultar status:', error)
      setToast({ tipo: 'error', mensagem: `Erro: ${error.message}` })
    } finally {
      setConsultando(false)
    }
  }

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded">
          <p className="text-sm">Carregando nota fiscal...</p>
        </div>
      </div>
    )
  }

  if (!nota) return null

  const podeEditar = nota.status === 'REJEITADA' || nota.status === 'RASCUNHO'
  const podeTransmitir = nota.status === 'REJEITADA' || nota.status === 'RASCUNHO'
  const podeCancelar = nota.status === 'AUTORIZADA'

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Cabeçalho */}
          <div className="bg-[#394353] text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="text-base font-semibold">
                Editar Nota Fiscal #{String(nota.numero).padStart(6, '0')}
              </h2>
              <p className="text-xs mt-1">
                Série {nota.serie} | Status: {nota.status}
                {nota.codigo_status_sefaz && ` | Código: ${nota.codigo_status_sefaz}`}
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            {/* Alerta de status */}
            {nota.status === 'REJEITADA' && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm font-semibold text-red-800">❌ Nota Rejeitada</p>
                <p className="text-xs text-red-700 mt-1">
                  {nota.motivo_status || 'Motivo não especificado'}
                </p>
              </div>
            )}

            {nota.status === 'AUTORIZADA' && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm font-semibold text-green-800">✅ Nota Autorizada</p>
                <p className="text-xs text-green-700 mt-1">
                  Chave: {nota.chave_acesso}
                </p>
              </div>
            )}

            {nota.status === 'CANCELADA' && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm font-semibold text-orange-800">🚫 Nota Cancelada</p>
                <p className="text-xs text-orange-700 mt-1">
                  {nota.justificativa_cancelamento || nota.motivo_cancelamento || 'Cancelada pelo usuário'}
                </p>
                {nota.data_cancelamento && (
                  <p className="text-xs text-orange-600 mt-1">
                    Cancelada em: {new Date(nota.data_cancelamento).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {/* Dados Gerais */}
            <div className="border border-[#C9C4B5] rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Dados Gerais</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Natureza da Operação</label>
                  <input
                    type="text"
                    value={nota.natureza_operacao || ''}
                    onChange={(e) => setNota({ ...nota, natureza_operacao: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Modalidade Frete</label>
                  <select
                    value={nota.modalidade_frete || '9'}
                    onChange={(e) => setNota({ ...nota, modalidade_frete: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  >
                    <option value="0">0 - Por conta do emitente</option>
                    <option value="1">1 - Por conta do destinatário</option>
                    <option value="9">9 - Sem frete</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Forma Pagamento</label>
                  <select
                    value={nota.forma_pagamento || '0'}
                    onChange={(e) => setNota({ ...nota, forma_pagamento: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  >
                    <option value="0">0 - À vista</option>
                    <option value="1">1 - À prazo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Destinatário */}
            <div className="border border-[#C9C4B5] rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Destinatário</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Nome / Razão Social</label>
                  <input
                    type="text"
                    value={nota.destinatario_nome || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_nome: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={nota.destinatario_cpf_cnpj || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_cpf_cnpj: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={nota.destinatario_ie || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_ie: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Email</label>
                  <input
                    type="email"
                    value={nota.destinatario_email || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_email: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Telefone</label>
                  <input
                    type="text"
                    value={nota.destinatario_telefone || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_telefone: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-4 gap-3 mt-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Logradouro</label>
                  <input
                    type="text"
                    value={nota.destinatario_logradouro || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_logradouro: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Número</label>
                  <input
                    type="text"
                    value={nota.destinatario_numero || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_numero: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Complemento</label>
                  <input
                    type="text"
                    value={nota.destinatario_complemento || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_complemento: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Bairro</label>
                  <input
                    type="text"
                    value={nota.destinatario_bairro || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_bairro: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Cidade</label>
                  <input
                    type="text"
                    value={nota.destinatario_cidade || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_cidade: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">UF</label>
                  <input
                    type="text"
                    value={nota.destinatario_uf || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_uf: e.target.value })}
                    disabled={!podeEditar}
                    maxLength={2}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">CEP</label>
                  <input
                    type="text"
                    value={nota.destinatario_cep || ''}
                    onChange={(e) => setNota({ ...nota, destinatario_cep: e.target.value })}
                    disabled={!podeEditar}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Itens */}
            <div className="border border-[#C9C4B5] rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Itens da Nota ({itens.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#394353] text-white">
                    <tr>
                      <th className="px-2 py-2 text-left">Item</th>
                      <th className="px-2 py-2 text-left">Código</th>
                      <th className="px-2 py-2 text-left">Descrição</th>
                      <th className="px-2 py-2 text-left">NCM</th>
                      <th className="px-2 py-2 text-left">CFOP</th>
                      <th className="px-2 py-2 text-right">Qtd</th>
                      <th className="px-2 py-2 text-right">Vlr Unit</th>
                      <th className="px-2 py-2 text-right">Vlr Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9C4B5]">
                    {itens.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2">{item.numero_item}</td>
                        <td className="px-2 py-2">{item.codigo_produto}</td>
                        <td className="px-2 py-2">{item.descricao}</td>
                        <td className="px-2 py-2">{item.ncm}</td>
                        <td className="px-2 py-2">{item.cfop}</td>
                        <td className="px-2 py-2 text-right">{item.quantidade_comercial}</td>
                        <td className="px-2 py-2 text-right">R$ {Number(item.valor_unitario_comercial).toFixed(2)}</td>
                        <td className="px-2 py-2 text-right font-semibold">
                          R$ {(Number(item.quantidade_comercial) * Number(item.valor_unitario_comercial)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="border border-[#C9C4B5] rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Informações Adicionais</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Informações Complementares (Cliente)</label>
                  <textarea
                    value={nota.informacoes_complementares || ''}
                    onChange={(e) => setNota({ ...nota, informacoes_complementares: e.target.value })}
                    disabled={!podeEditar}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Informações ao Fisco</label>
                  <textarea
                    value={nota.informacoes_fisco || ''}
                    onChange={(e) => setNota({ ...nota, informacoes_fisco: e.target.value })}
                    disabled={!podeEditar}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353] disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé com botões */}
          <div className="border-t border-[#C9C4B5] p-4 flex justify-between items-center bg-gray-50 sticky bottom-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              Fechar
            </button>

            <div className="flex gap-3">
              {/* Botão Consultar Status na SEFAZ */}
              {(nota.status === 'AUTORIZADA' || nota.status === 'CANCELADA') && nota.nuvem_fiscal_id && (
                <button
                  onClick={handleConsultarStatus}
                  disabled={consultando}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  title="Consultar status atual na SEFAZ e atualizar"
                >
                  {consultando ? 'Consultando...' : '🔍 Consultar Status SEFAZ'}
                </button>
              )}

              {podeCancelar && (
                <button
                  onClick={() => setModalCancelamento(true)}
                  disabled={cancelando}
                  className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelando ? 'Cancelando...' : '🚫 Cancelar NF-e'}
                </button>
              )}

              {podeEditar && (
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="px-4 py-2 text-sm font-semibold bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : '💾 Salvar Alterações'}
                </button>
              )}

              {podeTransmitir && (
                <button
                  onClick={handleTransmitir}
                  disabled={transmitindo}
                  className="px-4 py-2 text-sm font-semibold bg-[#394353] text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  {transmitindo ? 'Transmitindo...' : '📤 Transmitir para SEFAZ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      {modalCancelamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-3">Cancelar Nota Fiscal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Digite a justificativa para o cancelamento (mínimo 15 caracteres):
            </p>
            <textarea
              value={justificativaCancelamento}
              onChange={(e) => setJustificativaCancelamento(e.target.value)}
              rows={4}
              placeholder="Ex: Nota emitida com dados incorretos do destinatário"
              className="w-full px-3 py-2 text-sm border border-[#C9C4B5] rounded focus:outline-none focus:ring-2 focus:ring-[#394353]"
            />
            <p className="text-xs text-gray-500 mt-1">
              {justificativaCancelamento.length} / 15 caracteres
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setModalCancelamento(false)}
                className="flex-1 px-4 py-2 text-sm font-semibold border border-[#C9C4B5] rounded hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando || justificativaCancelamento.length < 15}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {cancelando ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.tipo}
          message={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
