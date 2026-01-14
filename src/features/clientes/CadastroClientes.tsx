/**
 * CADASTRO DE CLIENTES - COMPONENTE PRINCIPAL
 * Interface completa para cadastro de clientes PF/PJ
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  TipoPessoa,
  StatusCliente,
  RegimeTributario,
  ContribuinteICMS,
  type Cliente,
  type ClienteFormData,
  type ClienteEndereco,
  type ClienteContato,
  type CondicaoPagamento,
  type TabelaPreco
} from './types'
import {
  validarCPF,
  validarCNPJ,
  consultarCNPJ,
  validarClientePF,
  validarClientePJ
} from './utils'
import {
  criarCliente,
  atualizarCliente,
  buscarClienteCompleto,
  buscarClientePorCPF,
  buscarClientePorCNPJ,
  listarCondicoesPagamento,
  listarTabelasPreco
} from './services'
import {
  DadosPessoaFisica,
  DadosPessoaJuridica,
  DadosFiscais,
  DadosFinanceiros,
  GerenciadorEnderecos,
  GerenciadorContatos,
  HistoricoCliente
} from './components'

export function CadastroClientes() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  // Estado do formulário
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(TipoPessoa.FISICA)
  const [formData, setFormData] = useState<Partial<ClienteFormData>>({
    tipo_pessoa: TipoPessoa.FISICA,
    status: StatusCliente.ATIVO
  })

  // Dados relacionados
  const [enderecos, setEnderecos] = useState<ClienteEndereco[]>([])
  const [contatos, setContatos] = useState<ClienteContato[]>([])
  const [condicoesPagamento, setCondicoesPagamento] = useState<CondicaoPagamento[]>([])
  const [tabelasPreco, setTabelasPreco] = useState<TabelaPreco[]>([])

  // Estado da interface
  const [abaAtiva, setAbaAtiva] = useState('dados')
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null)
  const [consultandoCPF, setConsultandoCPF] = useState(false)
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false)

  // Carrega dados iniciais
  useEffect(() => {
    carregarDados()
  }, [id])

  // Carrega condições de pagamento e tabelas de preço
  useEffect(() => {
    carregarCondicoesPagamento()
    carregarTabelasPreco()
  }, [])

  async function carregarDados() {
    if (!id) return

    try {
      const cliente = await buscarClienteCompleto(id)
      
      setTipoPessoa(cliente.tipo_pessoa as TipoPessoa)
      setFormData({
        ...cliente,
        tipo_pessoa: cliente.tipo_pessoa as TipoPessoa,
        status: cliente.status as StatusCliente,
        regime_tributario: cliente.regime_tributario as RegimeTributario | undefined,
        contribuinte_icms: cliente.contribuinte_icms as ContribuinteICMS | undefined
      })

      if (cliente.enderecos) {
        setEnderecos(cliente.enderecos)
      }

      if (cliente.contatos) {
        setContatos(cliente.contatos)
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar dados do cliente' })
    }
  }

  async function carregarCondicoesPagamento() {
    try {
      const dados = await listarCondicoesPagamento()
      setCondicoesPagamento(dados)
    } catch (error) {
      console.error('Erro ao carregar condições de pagamento:', error)
    }
  }

  async function carregarTabelasPreco() {
    try {
      const dados = await listarTabelasPreco()
      setTabelasPreco(dados)
    } catch (error) {
      console.error('Erro ao carregar tabelas de preço:', error)
    }
  }

  function handleChange(campo: string, valor: any) {
    setFormData(prev => ({ ...prev, [campo]: valor }))
    
    // Remove erro do campo quando alterado
    if (erros[campo]) {
      setErros(prev => {
        const novos = { ...prev }
        delete novos[campo]
        return novos
      })
    }
  }

  function handleTipoPessoaChange(tipo: TipoPessoa) {
    setTipoPessoa(tipo)
    
    // Limpa campos específicos ao trocar tipo
    if (tipo === TipoPessoa.FISICA) {
      setFormData(prev => ({
        ...prev,
        tipo_pessoa: tipo,
        razao_social: undefined,
        nome_fantasia: undefined,
        cnpj: undefined,
        inscricao_estadual: undefined,
        inscricao_municipal: undefined,
        cnae_principal: undefined
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        tipo_pessoa: tipo,
        nome_completo: undefined,
        cpf: undefined,
        rg: undefined,
        data_nascimento: undefined,
        sexo: undefined,
        estado_civil: undefined
      }))
    }
  }

  async function handleConsultarCPF() {
    const cpf = formData.cpf
    if (!cpf || !validarCPF(cpf)) {
      setMensagem({ tipo: 'erro', texto: 'CPF inválido' })
      return
    }

    setConsultandoCPF(true)
    try {
      const clienteExistente = await buscarClientePorCPF(cpf)
      
      if (clienteExistente && String(clienteExistente.id) !== id) {
        setMensagem({ 
          tipo: 'erro', 
          texto: `CPF já cadastrado para o cliente: ${clienteExistente.nome_completo || clienteExistente.codigo}` 
        })
      } else {
        setMensagem({ tipo: 'sucesso', texto: 'CPF disponível' })
      }
    } catch (error) {
      console.error('Erro ao consultar CPF:', error)
    } finally {
      setConsultandoCPF(false)
    }
  }

  async function handleConsultarCNPJ() {
    const cnpj = formData.cnpj
    if (!cnpj || !validarCNPJ(cnpj)) {
      setMensagem({ tipo: 'erro', texto: 'CNPJ inválido' })
      return
    }

    setConsultandoCNPJ(true)
    setMensagem({ tipo: 'sucesso', texto: 'Consultando CNPJ na Receita Federal...' })
    
    try {
      // Verifica se já existe
      const clienteExistente = await buscarClientePorCNPJ(cnpj)
      
      if (clienteExistente && String(clienteExistente.id) !== id) {
        setMensagem({ 
          tipo: 'erro', 
          texto: `CNPJ já cadastrado para o cliente: ${clienteExistente.razao_social || clienteExistente.codigo}` 
        })
        setConsultandoCNPJ(false)
        return
      }

      // Consulta Receita Federal
      console.log('🔍 Iniciando consulta CNPJ:', cnpj)
      const dados = await consultarCNPJ(cnpj)
      
      console.log('📦 Dados recebidos:', dados)
      
      if (dados) {
        setFormData(prev => ({
          ...prev,
          razao_social: dados.nome,
          nome_fantasia: dados.fantasia,
          inscricao_estadual: 'ISENTO', // Geralmente precisa ser informado manualmente
          cnae_principal: dados.atividade_principal?.[0]?.code
        }))

        setMensagem({ tipo: 'sucesso', texto: 'Dados da Receita Federal importados com sucesso!' })
      } else {
        setMensagem({ tipo: 'erro', texto: 'Nenhum dado retornado pela Receita Federal' })
      }
    } catch (error: any) {
      console.error('❌ Erro ao consultar CNPJ:', error)
      const mensagemErro = error?.message || 'Erro ao consultar CNPJ na Receita Federal'
      
      // Mensagens mais específicas
      if (mensagemErro.includes('Failed to fetch') || mensagemErro.includes('NetworkError')) {
        setMensagem({ 
          tipo: 'erro', 
          texto: 'Erro de conexão com a Receita Federal. Verifique sua internet ou tente novamente em alguns minutos.' 
        })
      } else if (mensagemErro.includes('CORS')) {
        setMensagem({ 
          tipo: 'erro', 
          texto: 'Bloqueio CORS. A API ReceitaWS pode estar temporariamente indisponível.' 
        })
      } else {
        setMensagem({ tipo: 'erro', texto: mensagemErro })
      }
    } finally {
      setConsultandoCNPJ(false)
    }
  }

  function validarFormulario(): boolean {
    const novosErros: Record<string, string> = {}

    // Validação por tipo de pessoa
    if (tipoPessoa === TipoPessoa.FISICA) {
      const resultado = validarClientePF(formData)
      if (!resultado.valid) {
        resultado.errors.forEach(erro => {
          novosErros[erro.field] = erro.message
        })
      }
    } else {
      const resultado = validarClientePJ(formData)
      if (!resultado.valid) {
        resultado.errors.forEach(erro => {
          novosErros[erro.field] = erro.message
        })
      }
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSalvar() {
    if (!validarFormulario()) {
      setMensagem({ tipo: 'erro', texto: 'Corrija os erros no formulário antes de salvar' })
      setAbaAtiva('dados') // Volta para a aba de dados
      return
    }

    setSalvando(true)
    try {
      if (isEdicao && id) {
        await atualizarCliente(id, formData as Partial<Cliente>)
        setMensagem({ tipo: 'sucesso', texto: 'Cliente atualizado com sucesso!' })
      } else {
        const novoCliente = await criarCliente(formData as Partial<Cliente>)
        setMensagem({ tipo: 'sucesso', texto: 'Cliente cadastrado com sucesso!' })
        
        // Redireciona para edição do novo cliente
        setTimeout(() => {
          navigate(`/cadastro/clientes/${novoCliente.id}`)
        }, 1500)
      }
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error)
      setMensagem({ 
        tipo: 'erro', 
        texto: error.message || 'Erro ao salvar cliente. Tente novamente.' 
      })
    } finally {
      setSalvando(false)
    }
  }

  function handleCancelar() {
    if (confirm('Deseja realmente cancelar? As alterações não salvas serão perdidas.')) {
      navigate('/cadastro/clientes')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {isEdicao ? 'Editar Cliente' : 'Novo Cliente'}
              </h1>
              {isEdicao && formData.codigo && (
                <p className="text-xs text-gray-600 mt-1">Código: {formData.codigo}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelar}
                className="px-4 py-2.5 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 text-sm font-semibold"
                style={{borderColor: '#C9C4B5'}}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                style={{backgroundColor: '#394353'}}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Mensagens */}
          {mensagem && (
            <div className={`mt-3 p-3 rounded-lg ${
              mensagem.tipo === 'sucesso' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="text-xs font-medium">{mensagem.texto}</p>
            </div>
          )}
        </div>

        {/* Tipo de Pessoa (só exibe no modo criação) */}
        {!isEdicao && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tipo de Pessoa
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleTipoPessoaChange(TipoPessoa.FISICA)}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-semibold ${
                  tipoPessoa === TipoPessoa.FISICA
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:opacity-90'
                }`}
                style={tipoPessoa === TipoPessoa.FISICA ? {backgroundColor: '#394353', borderColor: '#394353'} : {borderColor: '#C9C4B5'}}
              >
                👤 Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => handleTipoPessoaChange(TipoPessoa.JURIDICA)}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-semibold ${
                  tipoPessoa === TipoPessoa.JURIDICA
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:opacity-90'
                }`}
                style={tipoPessoa === TipoPessoa.JURIDICA ? {backgroundColor: '#394353', borderColor: '#394353'} : {borderColor: '#C9C4B5'}}
              >
                🏢 Pessoa Jurídica
              </button>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setAbaAtiva('dados')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'dados'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                📋 Dados Principais
              </button>
              <button
                onClick={() => setAbaAtiva('fiscal')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'fiscal'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                📄 Dados Fiscais
              </button>
              <button
                onClick={() => setAbaAtiva('financeiro')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'financeiro'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                💰 Dados Financeiros
              </button>
              <button
                onClick={() => setAbaAtiva('enderecos')}
                disabled={!isEdicao}
                title={!isEdicao ? 'Salve o cliente primeiro para adicionar endereços' : ''}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'enderecos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                } ${!isEdicao ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                📍 Endereços {!isEdicao && '🔒'}
              </button>
              <button
                onClick={() => setAbaAtiva('contatos')}
                disabled={!isEdicao}
                title={!isEdicao ? 'Salve o cliente primeiro para adicionar contatos' : ''}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'contatos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                } ${!isEdicao ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                📞 Contatos {!isEdicao && '🔒'}
              </button>
              {isEdicao && (
                <button
                  onClick={() => setAbaAtiva('historico')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    abaAtiva === 'historico'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  📜 Histórico
                </button>
              )}
            </nav>
          </div>

          {/* Conteúdo das Abas */}
          <div className="p-6">
            {abaAtiva === 'dados' && (
              <>
                {tipoPessoa === TipoPessoa.FISICA ? (
                  <DadosPessoaFisica
                    formData={formData}
                    onChange={handleChange}
                    erros={erros}
                    onConsultarCPF={handleConsultarCPF}
                    consultando={consultandoCPF}
                  />
                ) : (
                  <DadosPessoaJuridica
                    formData={formData}
                    onChange={handleChange}
                    erros={erros}
                    onConsultarCNPJ={handleConsultarCNPJ}
                    consultando={consultandoCNPJ}
                  />
                )}
              </>
            )}

            {abaAtiva === 'fiscal' && (
              <DadosFiscais
                formData={formData}
                onChange={handleChange}
                erros={erros}
              />
            )}

            {abaAtiva === 'financeiro' && (
              <DadosFinanceiros
                formData={formData}
                onChange={handleChange}
                erros={erros}
                condicoesPagamento={condicoesPagamento}
                tabelasPreco={tabelasPreco}
              />
            )}

            {abaAtiva === 'enderecos' && isEdicao && id && (
              <GerenciadorEnderecos
                clienteId={id}
                enderecos={enderecos}
                onAtualizarEnderecos={setEnderecos}
              />
            )}

            {abaAtiva === 'contatos' && isEdicao && id && (
              <GerenciadorContatos
                clienteId={id}
                contatos={contatos}
                onAtualizarContatos={setContatos}
              />
            )}

            {abaAtiva === 'historico' && isEdicao && id && (
              <HistoricoCliente clienteId={id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
