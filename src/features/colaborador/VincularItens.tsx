import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

interface Item {
  id: string
  codigo: string
  item: string
  modelo?: string
  categoria?: string
  numero_serie?: string
  detalhes?: string
  nota_fiscal?: string
  fornecedor?: string
  setor: string
  status: string
  valor: number
  created_at: string
  responsavel_id?: string | null
}

interface Colaborador {
  id: string
  tipo_pessoa: 'fisica' | 'juridica'
  nome: string
  cpf: string | null
  cnpj: string | null
  email: string
  telefone: string
  setor: string
  cargo: string
  empresa_id: string
  created_at: string
}

interface VincularItensProps {
  colaborador: Colaborador
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function VincularItens({ colaborador, isOpen, onClose, onSuccess }: VincularItensProps) {
  const [itens, setItens] = useState<Item[]>([])
  const [itensVinculados, setItensVinculados] = useState<Item[]>([])
  const [itensSelecionados, setItensSelecionados] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingItens, setLoadingItens] = useState(false)
  const [loadingVinculados, setLoadingVinculados] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'disponivel' | 'vinculado'>('disponivel')

  // Buscar itens disponíveis (sem responsável)
  const fetchItens = async () => {
    try {
      setLoadingItens(true)
      
      if (!isSupabaseConfigured) {
        // Dados mock para demo
        setItens([
          {
            id: '1',
            codigo: 'ITEM-001',
            item: 'Notebook Dell Inspiron',
            modelo: 'Inspiron 15 3000',
            categoria: 'Informática',
            numero_serie: 'SN123456789',
            detalhes: 'Notebook para uso administrativo',
            nota_fiscal: 'NF-12345',
            fornecedor: 'Dell Inc.',
            setor: 'TI',
            status: 'Disponível',
            valor: 3500.00,
            created_at: '2024-01-15',
            responsavel_id: null
          },
          {
            id: '2',
            codigo: 'ITEM-002',
            item: 'Mouse Logitech',
            modelo: 'MX Master 3',
            categoria: 'Informática',
            numero_serie: 'SN987654321',
            detalhes: 'Mouse sem fio',
            nota_fiscal: 'NF-12346',
            fornecedor: 'Logitech',
            setor: 'TI',
            status: 'Disponível',
            valor: 450.00,
            created_at: '2024-01-16',
            responsavel_id: null
          }
        ])
      } else {
        const { data, error } = await supabase
          .from('itens')
          .select('*')
          .is('responsavel_id', null)
          .order('item')

        if (error) throw error
        setItens(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      setItens([])
    } finally {
      setLoadingItens(false)
    }
  }

  // Buscar itens já vinculados ao colaborador
  const fetchItensVinculados = async () => {
    try {
      setLoadingVinculados(true)
      
      if (!isSupabaseConfigured) {
        // Dados mock para demo - simula itens já vinculados
        setItensVinculados([
          {
            id: '10',
            codigo: 'ITEM-010',
            item: 'Notebook HP ProBook',
            modelo: 'ProBook 450 G8',
            categoria: 'Informática',
            numero_serie: 'SN555666777',
            detalhes: 'Notebook corporativo',
            nota_fiscal: 'NF-99999',
            fornecedor: 'HP Inc.',
            setor: 'Administrativo',
            status: 'Em Uso',
            valor: 4200.00,
            created_at: '2024-01-10',
            responsavel_id: colaborador.id
          },
          {
            id: '11',
            codigo: 'ITEM-011',
            item: 'Mouse Wireless Microsoft',
            modelo: 'Arc Mouse',
            categoria: 'Informática',
            numero_serie: 'SN888999000',
            detalhes: 'Mouse sem fio ergonômico',
            nota_fiscal: 'NF-88888',
            fornecedor: 'Microsoft',
            setor: 'Administrativo',
            status: 'Em Uso',
            valor: 280.00,
            created_at: '2024-01-12',
            responsavel_id: colaborador.id
          }
        ])
      } else {
        const { data, error } = await supabase
          .from('itens')
          .select('*')
          .eq('responsavel_id', colaborador.id)
          .order('item')

        if (error) throw error
        setItensVinculados(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar itens vinculados:', error)
      setItensVinculados([])
    } finally {
      setLoadingVinculados(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchItens()
      fetchItensVinculados()
      setItensSelecionados([])
    }
  }, [isOpen])

  // Filtrar itens
  const itensFiltrados = itens.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.categoria && item.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.setor && item.setor.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Toggle seleção de item
  const toggleItem = (item: Item) => {
    if (itensSelecionados.find(i => i.id === item.id)) {
      setItensSelecionados(itensSelecionados.filter(i => i.id !== item.id))
    } else {
      setItensSelecionados([...itensSelecionados, item])
    }
  }

  // Vincular itens ao colaborador
  const vincularItens = async () => {
    if (itensSelecionados.length === 0) return

    try {
      setSaving(true)

      if (!isSupabaseConfigured) {
        // Simular sucesso em modo demo
        alert(`${itensSelecionados.length} item(ns) vinculado(s) com sucesso!`)
        onSuccess?.()
        onClose()
        return
      }

      // Atualizar os itens com o responsavel_id
      const updates = itensSelecionados.map(item => ({
        id: item.id,
        responsavel_id: colaborador.id
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('itens')
          .update({ responsavel_id: update.responsavel_id })
          .eq('id', update.id)

        if (error) throw error
      }

      alert(`${itensSelecionados.length} item(ns) vinculado(s) com sucesso!`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro ao vincular itens:', error)
      alert('Erro ao vincular itens. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Desvincular item do colaborador
  const desvincularItem = async (itemId: string) => {
    if (!confirm('Deseja realmente desvincular este item?')) return

    try {
      setSaving(true)

      if (!isSupabaseConfigured) {
        // Simular sucesso em modo demo
        setItensVinculados(itensVinculados.filter(item => item.id !== itemId))
        alert('Item desvinculado com sucesso!')
        onSuccess?.()
        return
      }

      const { error } = await supabase
        .from('itens')
        .update({ responsavel_id: null })
        .eq('id', itemId)

      if (error) throw error

      alert('Item desvinculado com sucesso!')
      fetchItens()
      fetchItensVinculados()
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao desvincular item:', error)
      alert('Erro ao desvincular item. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Gerar termo de responsabilidade
  const gerarTermo = () => {
    if (itensSelecionados.length === 0) return

    const empresaInfo = {
      nome: 'CRESCI E PERDI FRANCHISING LTDA',
      cnpj: '27.767.670/0001-94'
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR')
    const localData = 'São José do Rio Pardo - SP'

    // Criar lista de itens
    const listaItens = itensSelecionados.map(item => `
      <li style="margin-bottom: 15px; line-height: 1.6;">
        <div><span class="bold">Código:</span> ${item.codigo}</div>
        <div><span class="bold">Item:</span> ${item.item}</div>
        <div><span class="bold">Detalhes:</span> ${item.modelo || '-'}</div>
        <div><span class="bold">Número de Série:</span> ${item.numero_serie || '-'}</div>
      </li>
    `).join('')

    // Criar um novo elemento para impressão
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Termo de Responsabilidade</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 0;
              max-width: 21cm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 25px;
              text-decoration: underline;
            }
            .content {
              text-align: justify;
              margin-bottom: 15px;
            }
            .equipment-info {
              margin: 20px 0;
              margin-left: 20px;
            }
            .equipment-info li {
              margin-bottom: 15px;
              list-style-type: none;
              padding-left: 10px;
              line-height: 1.6;
            }
            .equipment-info li div {
              margin-bottom: 3px;
            }
            .clause {
              margin-bottom: 15px;
              text-align: justify;
            }
            .signatures {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signature-left, .signature-right {
              text-align: center;
              width: 45%;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              margin-bottom: 5px;
              padding-bottom: 2px;
              height: 40px;
            }
            .location-date {
              text-align: center;
              margin-top: 30px;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body { 
                margin: 0; 
                font-size: 11px;
              }
              .no-print { 
                display: none; 
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            TERMO DE RESPONSABILIDADE DE UTILIZAÇÃO DE EQUIPAMENTOS
          </div>
          
          <div class="content">
            A <span class="bold">EMPREGADORA</span> <span class="bold">${empresaInfo.nome}</span>, inscrita no CNPJ sob o nº <span class="bold">${empresaInfo.cnpj}</span>, 
            entrega neste ato, os equipamentos descritos abaixo:
          </div>
          
          <div class="equipment-info">
            <ul style="margin-left: 0; padding-left: 0;">
              ${listaItens}
            </ul>
          </div>
          
          <div class="content">
            Os equipamentos serão utilizados, exclusivamente, pelo <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR DE SERVIÇOS'}</span>, <span class="bold">${colaborador.nome.toUpperCase()}</span>, que exerce a 
            função <span class="bold">${colaborador.cargo.toUpperCase()}</span>, portador do ${colaborador.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'} <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? colaborador.cpf : colaborador.cnpj}</span>, e sob sua responsabilidade, conforme 
            as seguintes condições:
          </div>
          
          <div class="clause">
            <span class="bold">1.</span> Os equipamentos deverão ser utilizados <span class="bold">ÚNICA E EXCLUSIVAMENTE</span> a serviço da empresa tendo em vista a 
            atividade exercida pelo <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR'}</span>, supra informado.
          </div>
          
          <div class="clause">
            <span class="bold">2.</span> O <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR'}</span> somente utilizará os equipamentos para fins profissionais, 
            devendo ser respeitado o horário comercial.
          </div>
          
          <div class="clause">
            <span class="bold">3.</span> A manutenção dos equipamentos será realizada pela empresa, ficando o <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR'}</span> isento 
            de realizar qualquer pagamento, salvo em casos de mau uso comprovado.
          </div>
          
          <div class="clause">
            <span class="bold">4.</span> O <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR'}</span> tem somente a <span class="bold">POSSE</span> dos equipamentos, supra informados, em razão do uso 
            exclusivo para prestação de serviços profissionais e <span class="bold">NÃO A PROPRIEDADE</span> dos equipamentos, sendo, 
            terminantemente, proibidos os empréstimos, aluguel ou cessão destes a terceiros, ou qualquer outro tipo uso, 
            sem a prévia e expressa autorização da <span class="bold">EMPREGADORA</span>.
          </div>
          
          <div class="clause">
            <span class="bold">5.</span> Ao término da prestação de serviço ou do contrato individual de trabalho, o <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR'}</span> se compromete a 
            devolver os equipamentos em perfeito estado de conservação, no mesmo dia em que for comunicado ou que 
            comunique a rescisão do contrato, ressalvados os desgastes naturais pelo uso normal dos 
            equipamentos.
          </div>
          
          <div class="clause">
            <span class="bold">6.</span> Em caso de dano, inutilização, roubo/furto ou extravio dos equipamentos, a <span class="bold">EMPREGADORA</span> deverá ser, 
            imediatamente, comunicada.
          </div>
          
          <div class="clause">
            <span class="bold">7.</span> Se os equipamentos forem danificados ou inutilizados, por dolo ou culpa, exclusiva, do <span class="bold">${colaborador.tipo_pessoa === 'fisica' ? 'EMPREGADO' : 'PRESTADOR'}</span>, em 
            razão de uso inadequado ou mau uso, a <span class="bold">EMPREGADORA</span>, poderá exigir o ressarcimento no valor referente aos 
            equipamentos e/ou seus acessórios${colaborador.tipo_pessoa === 'fisica' ? ', nos exatos termos do art. 462, § 1º, da CLT' : ''}.
          </div>
          
          <div class="signatures">
            <div class="signature-left">
              <div class="signature-line"></div>
              <div>${colaborador.nome.toUpperCase()}</div>
              <div>${colaborador.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}: ${colaborador.tipo_pessoa === 'fisica' ? colaborador.cpf : colaborador.cnpj}</div>
            </div>
            <div class="signature-right">
              <div class="signature-line"></div>
              <div>${empresaInfo.nome}</div>
              <div>CNPJ: ${empresaInfo.cnpj}</div>
            </div>
          </div>
          
          <div class="location-date">
            ${localData} - ${dataAtual}
          </div>
          
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vincular Itens e Gerar Termo</h2>
            <p className="text-sm text-gray-600 mt-1">Selecione os itens para vincular ao colaborador {colaborador.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informações do Colaborador */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Colaborador Selecionado
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Nome:</span> {colaborador.nome}</div>
              <div><span className="font-medium">{colaborador.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}:</span> {colaborador.tipo_pessoa === 'fisica' ? colaborador.cpf : colaborador.cnpj}</div>
              <div><span className="font-medium">Cargo:</span> {colaborador.cargo}</div>
              <div><span className="font-medium">Setor:</span> {colaborador.setor}</div>
            </div>
          </div>

          {/* Abas */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('disponivel')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'disponivel'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Itens Disponíveis
                {itens.length > 0 && <span className="ml-2 bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">{itens.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('vinculado')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'vinculado'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Itens Vinculados
                {itensVinculados.length > 0 && <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{itensVinculados.length}</span>}
              </button>
            </nav>
          </div>

          {/* Conteúdo da Aba: Itens Disponíveis */}
          {activeTab === 'disponivel' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Itens Disponíveis</h3>
              <p className="text-sm text-gray-600 mb-4">Selecione os itens que serão vinculados a este colaborador.</p>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por item, código, categoria ou setor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {loadingItens ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Carregando itens disponíveis...</p>
                </div>
              ) : itensFiltrados.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>Nenhum item disponível encontrado</p>
                </div>
              ) : (
                itensFiltrados.map((item) => {
                  const isSelected = itensSelecionados.find(i => i.id === item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleItem(item)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Nome do Item */}
                              <div className="font-semibold text-gray-900">{item.item}</div>
                              
                              {/* Informações em linha */}
                              <div className="text-sm text-gray-600 mt-0.5">
                                <span>Cód: {item.codigo}</span>
                                {item.categoria && <span className="ml-3">• {item.categoria}</span>}
                                {item.setor && <span className="ml-3">• {item.setor}</span>}
                              </div>
                              
                              {/* Modelo e S/N */}
                              {(item.modelo || item.numero_serie) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {item.modelo && <span>Modelo: {item.modelo}</span>}
                                  {item.numero_serie && <span className={item.modelo ? "ml-3" : ""}>S/N: {item.numero_serie}</span>}
                                </div>
                              )}
                            </div>
                            
                            {/* Valor */}
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-gray-900">
                                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Itens Selecionados Summary */}
            {itensSelecionados.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium text-green-800">
                      {itensSelecionados.length} item(ns) selecionado(s)
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    Valor total: R$ {itensSelecionados.reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Conteúdo da Aba: Itens Vinculados */}
          {activeTab === 'vinculado' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Itens Vinculados a Este Colaborador</h3>
              <p className="text-sm text-gray-600 mb-4">Itens atualmente sob responsabilidade de {colaborador.nome}.</p>

              {/* Lista de Itens Vinculados */}
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {loadingVinculados ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando itens vinculados...</p>
                  </div>
                ) : itensVinculados.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm">Nenhum item vinculado a este colaborador</p>
                  </div>
                ) : (
                  itensVinculados.map((item) => (
                    <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Nome do Item */}
                              <div className="font-semibold text-gray-900">{item.item}</div>
                              
                              {/* Informações em linha */}
                              <div className="text-sm text-gray-600 mt-0.5">
                                <span>Cód: {item.codigo}</span>
                                {item.categoria && <span className="ml-3">• {item.categoria}</span>}
                                {item.setor && <span className="ml-3">• {item.setor}</span>}
                              </div>
                              
                              {/* Modelo e S/N */}
                              {(item.modelo || item.numero_serie) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {item.modelo && <span>Modelo: {item.modelo}</span>}
                                  {item.numero_serie && <span className={item.modelo ? "ml-3" : ""}>S/N: {item.numero_serie}</span>}
                                </div>
                              )}
                            </div>
                            
                            {/* Valor e Ação */}
                            <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                              <div className="font-semibold text-gray-900">
                                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <button
                                onClick={() => desvincularItem(item.id)}
                                disabled={saving}
                                className="text-xs px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Desvincular
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total de Itens Vinculados */}
              {itensVinculados.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="font-medium text-blue-800">
                        Total: {itensVinculados.length} item(ns) vinculado(s)
                      </span>
                    </div>
                    <div className="text-sm text-blue-700">
                      Valor total: R$ {itensVinculados.reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          {activeTab === 'disponivel' && (
          <div className="flex space-x-3">
            <button
              onClick={vincularItens}
              disabled={itensSelecionados.length === 0 || saving}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Vinculando...' : 'Apenas Vincular'}
            </button>
            <button
              onClick={() => {
                vincularItens().then(() => {
                  setTimeout(() => gerarTermo(), 500)
                })
              }}
              disabled={itensSelecionados.length === 0 || saving}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {saving ? 'Processando...' : 'Vincular e Gerar Termo'}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
