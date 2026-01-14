// =====================================================
// COMPONENTE - CADASTRO DE TIPOS DE CONTRIBUINTE
// Gerenciamento de tipos de contribuintes para clientes
// Data: 14/01/2026
// =====================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface TipoContribuinte {
  id: number
  nome: string
  descricao?: string
  consumidor_final: boolean
  contribuinte_icms: 'CONTRIBUINTE' | 'ISENTO' | 'NAO_CONTRIBUINTE'
  ativo: boolean
  created_at: string
  updated_at: string
}

export default function CadastroTiposContribuinte() {
  const [tipos, setTipos] = useState<TipoContribuinte[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<TipoContribuinte | null>(null)
  const [modoEdicao, setModoEdicao] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    consumidor_final: true,
    contribuinte_icms: 'NAO_CONTRIBUINTE' as 'CONTRIBUINTE' | 'ISENTO' | 'NAO_CONTRIBUINTE',
    ativo: true
  })

  useEffect(() => {
    carregarTipos()
  }, [])

  const carregarTipos = async () => {
    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from('tipos_contribuinte')
        .select('*')
        .order('nome')

      if (error) throw error
      setTipos(data || [])
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
      alert('Erro ao carregar tipos de contribuinte')
    } finally {
      setCarregando(false)
    }
  }

  const salvarTipo = async () => {
    try {
      if (!formData.nome.trim()) {
        alert('Nome é obrigatório')
        return
      }

      if (editando) {
        // Atualizar
        const { error } = await supabase
          .from('tipos_contribuinte')
          .update(formData)
          .eq('id', editando.id)

        if (error) throw error
        alert('Tipo de contribuinte atualizado com sucesso!')
      } else {
        // Criar novo
        const { error } = await supabase
          .from('tipos_contribuinte')
          .insert([formData])

        if (error) throw error
        alert('Tipo de contribuinte criado com sucesso!')
      }

      limparFormulario()
      carregarTipos()
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert(error.message || 'Erro ao salvar tipo de contribuinte')
    }
  }

  const editarTipo = (tipo: TipoContribuinte) => {
    setEditando(tipo)
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      consumidor_final: tipo.consumidor_final,
      contribuinte_icms: tipo.contribuinte_icms,
      ativo: tipo.ativo
    })
    setModoEdicao(true)
  }

  const excluirTipo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este tipo de contribuinte?')) return

    try {
      const { error } = await supabase
        .from('tipos_contribuinte')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Tipo excluído com sucesso!')
      carregarTipos()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      alert(error.message || 'Erro ao excluir tipo de contribuinte')
    }
  }

  const limparFormulario = () => {
    setFormData({
      nome: '',
      descricao: '',
      consumidor_final: true,
      contribuinte_icms: 'NAO_CONTRIBUINTE',
      ativo: true
    })
    setEditando(null)
    setModoEdicao(false)
  }

  return (
    <div className="space-y-4">
      {/* Formulário */}
      <div className="bg-white border border-[#C9C4B5] rounded-lg p-4">
        <h3 className="text-base font-semibold text-[#394353] mb-3">
          {modoEdicao ? 'Editar Tipo de Contribuinte' : 'Novo Tipo de Contribuinte'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-[#C9C4B5] rounded-md text-sm focus:ring-2 focus:ring-[#394353]"
              placeholder="Ex: Contribuinte ICMS - SP"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 border border-[#C9C4B5] rounded-md text-sm focus:ring-2 focus:ring-[#394353]"
              rows={2}
              placeholder="Descrição detalhada do tipo de contribuinte..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contribuinte ICMS *
            </label>
            <select
              value={formData.contribuinte_icms}
              onChange={(e) => setFormData({ ...formData, contribuinte_icms: e.target.value as any })}
              className="w-full px-3 py-2 border border-[#C9C4B5] rounded-md text-sm focus:ring-2 focus:ring-[#394353]"
            >
              <option value="NAO_CONTRIBUINTE">9 - Não Contribuinte</option>
              <option value="CONTRIBUINTE">1 - Contribuinte</option>
              <option value="ISENTO">2 - Isento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Consumidor Final
            </label>
            <select
              value={formData.consumidor_final ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, consumidor_final: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-[#C9C4B5] rounded-md text-sm focus:ring-2 focus:ring-[#394353]"
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={formData.ativo ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-[#C9C4B5] rounded-md text-sm focus:ring-2 focus:ring-[#394353]"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={salvarTipo}
            className="px-4 py-2 bg-[#394353] text-white text-sm font-semibold rounded-md hover:opacity-90"
          >
            {modoEdicao ? 'Atualizar' : 'Salvar'}
          </button>
          {modoEdicao && (
            <button
              onClick={limparFormulario}
              className="px-4 py-2 bg-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-400"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Listagem */}
      <div className="bg-white border border-[#C9C4B5] rounded-lg overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center text-slate-600">Carregando...</div>
        ) : tipos.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            Nenhum tipo de contribuinte cadastrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#394353] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Contribuinte ICMS</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold">Consumidor Final</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tipos.map(tipo => (
                  <tr key={tipo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-800">{tipo.nome}</div>
                      {tipo.descricao && (
                        <div className="text-xs text-slate-500 mt-1">{tipo.descricao}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700">
                        {tipo.contribuinte_icms === 'CONTRIBUINTE' && '1 - Contribuinte'}
                        {tipo.contribuinte_icms === 'ISENTO' && '2 - Isento'}
                        {tipo.contribuinte_icms === 'NAO_CONTRIBUINTE' && '9 - Não Contribuinte'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tipo.consumidor_final 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {tipo.consumidor_final ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tipo.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => editarTipo(tipo)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluirTipo(tipo.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
