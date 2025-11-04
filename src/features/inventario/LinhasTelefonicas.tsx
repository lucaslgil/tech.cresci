import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

interface LinhaTelefonica {
  id: string
  responsavel_id: string | null
  responsavel_nome?: string
  numero_linha: string
  tipo: 'eSIM' | 'Chip Físico'
  operadora: string
  usuario_setor: string | null
  plano: string
  valor_plano: number
  created_at?: string
}

interface Colaborador {
  id: string
  nome: string
}

export const LinhasTelefonicas: React.FC = () => {
  const [linhas, setLinhas] = useState<LinhaTelefonica[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Estados para busca de responsável
  const [searchResponsavel, setSearchResponsavel] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<Colaborador | null>(null)
  
  // Estados para importação de Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] })
  
  const [formData, setFormData] = useState<Omit<LinhaTelefonica, 'id' | 'created_at' | 'responsavel_nome'>>({
    responsavel_id: null,
    numero_linha: '',
    tipo: 'Chip Físico',
    operadora: '',
    usuario_setor: null,
    plano: '',
    valor_plano: 0
  })

  useEffect(() => {
    fetchLinhas()
    fetchColaboradores()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const fetchLinhas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('linhas_telefonicas')
        .select(`
          *,
          colaboradores:responsavel_id (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const linhasFormatadas = data?.map((linha: any) => ({
        ...linha,
        responsavel_nome: linha.colaboradores?.nome || ''
      })) || []

      setLinhas(linhasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar linhas:', error)
      alert('Erro ao carregar linhas telefônicas')
    } finally {
      setLoading(false)
    }
  }

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome')
        .eq('status', 'Ativo')
        .order('nome')

      if (error) throw error
      setColaboradores(data || [])
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error)
    }
  }

  const openModal = (linha?: LinhaTelefonica) => {
    if (linha) {
      setEditingId(linha.id)
      setFormData({
        responsavel_id: linha.responsavel_id,
        numero_linha: linha.numero_linha,
        tipo: linha.tipo,
        operadora: linha.operadora,
        usuario_setor: linha.usuario_setor,
        plano: linha.plano,
        valor_plano: linha.valor_plano
      })
      // Buscar o nome do responsável se houver
      if (linha.responsavel_id) {
        const resp = colaboradores.find(c => c.id === linha.responsavel_id)
        if (resp) {
          setResponsavelSelecionado(resp)
          setSearchResponsavel(resp.nome)
        }
      } else {
        setResponsavelSelecionado(null)
        setSearchResponsavel('')
      }
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      responsavel_id: null,
      numero_linha: '',
      tipo: 'Chip Físico',
      operadora: '',
      usuario_setor: null,
      plano: '',
      valor_plano: 0
    })
    setSearchResponsavel('')
    setResponsavelSelecionado(null)
    setShowDropdown(false)
  }

  // Funções para busca de responsável
  const handleSearchResponsavel = (value: string) => {
    setSearchResponsavel(value)
    setShowDropdown(true)
    
    // Se limpar o campo, remove a seleção
    if (!value) {
      setResponsavelSelecionado(null)
      setFormData({ ...formData, responsavel_id: null })
    }
  }

  const handleSelectResponsavel = (colaborador: Colaborador) => {
    setResponsavelSelecionado(colaborador)
    setSearchResponsavel(colaborador.nome)
    setFormData({ ...formData, responsavel_id: colaborador.id })
    setShowDropdown(false)
  }

  const handleClearResponsavel = () => {
    setSearchResponsavel('')
    setResponsavelSelecionado(null)
    setFormData({ ...formData, responsavel_id: null })
    setShowDropdown(false)
  }

  // Filtrar colaboradores baseado na busca
  const colaboradoresFiltrados = colaboradores.filter(colab =>
    colab.nome.toLowerCase().includes(searchResponsavel.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.numero_linha.trim()) {
      alert('Número da linha é obrigatório')
      return
    }

    if (!formData.operadora.trim()) {
      alert('Operadora é obrigatória')
      return
    }

    if (!formData.plano.trim()) {
      alert('Plano é obrigatório')
      return
    }

    if (formData.valor_plano < 0) {
      alert('Valor do plano não pode ser negativo')
      return
    }

    try {
      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('linhas_telefonicas')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        alert('Linha telefônica atualizada com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('linhas_telefonicas')
          .insert([formData])

        if (error) throw error
        alert('Linha telefônica cadastrada com sucesso!')
      }

      setShowModal(false)
      resetForm()
      fetchLinhas()
    } catch (error: any) {
      console.error('Erro ao salvar linha:', error)
      alert(`Erro ao salvar linha telefônica: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta linha telefônica?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('linhas_telefonicas')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      alert('Linha telefônica excluída com sucesso!')
      fetchLinhas()
    } catch (error: any) {
      console.error('Erro ao excluir linha:', error)
      alert(`Erro ao excluir linha telefônica: ${error.message}`)
    }
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarNumero = (numero: string) => {
    // Remove caracteres não numéricos
    const apenasNumeros = numero.replace(/\D/g, '')
    
    // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (apenasNumeros.length === 10) {
      return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numero
  }

  // Função para baixar template de importação
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Número da Linha': '(11) 98765-4321',
        'Tipo': 'Chip Físico',
        'Operadora': 'Vivo',
        'Usuário/Setor': 'TI - Suporte',
        'Plano': 'Plano Controle 20GB',
        'Valor do Plano': 79.90,
        'Responsável': colaboradores[0]?.nome || 'Nome do Colaborador'
      },
      {
        'Número da Linha': '(11) 91234-5678',
        'Tipo': 'eSIM',
        'Operadora': 'Claro',
        'Usuário/Setor': 'Vendas',
        'Plano': 'Plano Pós 30GB',
        'Valor do Plano': 99.90,
        'Responsável': ''
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linhas Telefônicas')

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // Número da Linha
      { wch: 15 }, // Tipo
      { wch: 20 }, // Operadora
      { wch: 25 }, // Usuário/Setor
      { wch: 25 }, // Plano
      { wch: 18 }, // Valor do Plano
      { wch: 30 }  // Responsável
    ]
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, 'template_linhas_telefonicas.xlsx')
    alert('Modelo baixado com sucesso! Preencha e importe o arquivo.')
  }

  // Função para importar linhas via Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (jsonData.length === 0) {
        alert('O arquivo está vazio!')
        setLoading(false)
        return
      }

      const linhasParaImportar = []
      const erros: string[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const linha = i + 2 // +2 porque começa na linha 2 do Excel (linha 1 é cabeçalho)

        // Validações básicas
        const numeroLinha = row['Número da Linha'] || row['numero_linha'] || row['Numero da Linha']
        if (!numeroLinha) {
          erros.push(`Linha ${linha}: Número da Linha é obrigatório`)
          continue
        }

        const tipo = row['Tipo'] || row['tipo'] || 'Chip Físico' // Default se não informado
        if (tipo && tipo !== 'Chip Físico' && tipo !== 'eSIM') {
          erros.push(`Linha ${linha}: Tipo deve ser "Chip Físico" ou "eSIM"`)
          continue
        }

        const operadora = row['Operadora'] || row['operadora'] || ''

        // Usuário/Setor é opcional, mas limitado a 30 caracteres
        let usuarioSetor = row['Usuário/Setor'] || row['usuario_setor'] || row['Usuario/Setor'] || null
        if (usuarioSetor && usuarioSetor.length > 30) {
          erros.push(`Linha ${linha}: Usuário/Setor não pode ter mais de 30 caracteres`)
          continue
        }

        const plano = row['Plano'] || row['plano'] || ''

        const valorPlano = parseFloat(row['Valor do Plano'] || row['valor_plano'] || row['Valor do Plano'] || 0)
        if (valorPlano < 0) {
          erros.push(`Linha ${linha}: Valor do Plano não pode ser negativo`)
          continue
        }

        // Buscar responsável pelo nome (opcional)
        let responsavel_id = null
        const nomeResponsavel = row['Responsável'] || row['responsavel'] || row['Responsavel']
        if (nomeResponsavel) {
          const responsavelEncontrado = colaboradores.find(c => 
            c.nome.toLowerCase() === nomeResponsavel.toLowerCase()
          )
          if (responsavelEncontrado) {
            responsavel_id = responsavelEncontrado.id
          } else {
            erros.push(`Linha ${linha}: Responsável "${nomeResponsavel}" não encontrado`)
          }
        }

        linhasParaImportar.push({
          numero_linha: numeroLinha,
          tipo: tipo as 'eSIM' | 'Chip Físico',
          operadora: operadora,
          usuario_setor: usuarioSetor,
          plano: plano,
          valor_plano: valorPlano,
          responsavel_id: responsavel_id
        })
      }

      // Verificar se há dados para importar
      if (linhasParaImportar.length === 0) {
        setImportResult({
          success: 0,
          errors: erros
        })
        setShowImportModal(true)
        setLoading(false)
        return
      }

      // Importar linhas válidas
      const { data: insertedData, error } = await supabase
        .from('linhas_telefonicas')
        .insert(linhasParaImportar)
        .select()

      if (error) throw error

      const totalImportados = insertedData?.length || 0
      
      setImportResult({
        success: totalImportados,
        errors: erros
      })
      setShowImportModal(true)
      fetchLinhas()
    } catch (error: any) {
      console.error('Erro ao importar:', error)
      alert('Erro ao importar arquivo: ' + error.message)
    } finally {
      setLoading(false)
      // Limpar o input file
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Cabeçalho com botões */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Linhas Telefônicas</h1>
              <p className="text-sm text-gray-600 mt-1">
                {linhas.length} {linhas.length === 1 ? 'linha cadastrada' : 'linhas cadastradas'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-slate-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="sm:inline">Baixar Modelo</span>
              </button>
              <label className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-slate-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="sm:inline">Importar Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="sm:inline">Adicionar Linha</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Linhas */}
      {linhas.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">Nenhuma linha telefônica cadastrada</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Adicionar Linha" para começar</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Operadora
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Usuário/Setor
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {linhas.map((linha) => (
                  <tr key={linha.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatarNumero(linha.numero_linha)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        linha.tipo === 'eSIM' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {linha.tipo}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {linha.operadora}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {linha.usuario_setor || (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {linha.responsavel_nome || ''}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {linha.plano}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatarValor(linha.valor_plano)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openModal(linha)}
                        className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(linha.id)}
                        className="text-red-600 hover:text-red-900 font-medium transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? 'Editar Linha Telefônica' : 'Nova Linha Telefônica'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Responsável - Campo de busca */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Responsável
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchResponsavel}
                      onChange={(e) => handleSearchResponsavel(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar colaborador..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                    />
                    {responsavelSelecionado && (
                      <button
                        type="button"
                        onClick={handleClearResponsavel}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados */}
                  {showDropdown && searchResponsavel && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {colaboradoresFiltrados.length > 0 ? (
                        colaboradoresFiltrados.map((colab) => (
                          <button
                            key={colab.id}
                            type="button"
                            onClick={() => handleSelectResponsavel(colab)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          >
                            {colab.nome}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Nenhum colaborador encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Número da Linha */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Número da Linha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.numero_linha}
                    onChange={(e) => setFormData({ ...formData, numero_linha: e.target.value })}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Tipo - Radio buttons estilizados como checkboxes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="Chip Físico"
                        checked={formData.tipo === 'Chip Físico'}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'eSIM' | 'Chip Físico' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Chip Físico</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="eSIM"
                        checked={formData.tipo === 'eSIM'}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'eSIM' | 'Chip Físico' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">eSIM</span>
                    </label>
                  </div>
                </div>

                {/* Operadora */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Operadora
                  </label>
                  <input
                    type="text"
                    value={formData.operadora}
                    onChange={(e) => setFormData({ ...formData, operadora: e.target.value })}
                    placeholder="Ex: Vivo, Claro, Tim, Oi"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Usuário/Setor */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Usuário/Setor
                  </label>
                  <input
                    type="text"
                    value={formData.usuario_setor || ''}
                    onChange={(e) => setFormData({ ...formData, usuario_setor: e.target.value || null })}
                    placeholder="Ex: TI - Suporte, Vendas, Marketing"
                    maxLength={30}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo 30 caracteres</p>
                </div>

                {/* Plano */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Plano
                  </label>
                  <input
                    type="text"
                    value={formData.plano}
                    onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                    placeholder="Ex: Plano Controle 20GB"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Valor do Plano */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Valor do Plano
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_plano}
                    onChange={(e) => setFormData({ ...formData, valor_plano: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado da Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Resultado da Importação
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
              {/* Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-xs sm:text-sm text-green-700 mb-1 font-medium">Importadas com Sucesso</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900">{importResult.success}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs sm:text-sm text-red-700 mb-1 font-medium">Erros Encontrados</div>
                  <div className="text-2xl sm:text-3xl font-bold text-red-900">{importResult.errors.length}</div>
                </div>
              </div>

              {/* Lista de Erros */}
              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Detalhes dos Erros:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((erro, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-800">
                        {erro}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem de Sucesso Total */}
              {importResult.errors.length === 0 && importResult.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800 font-semibold text-sm sm:text-base">
                    Todas as linhas foram importadas com sucesso!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end rounded-b-lg">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
