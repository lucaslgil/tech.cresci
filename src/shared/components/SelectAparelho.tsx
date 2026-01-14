import React, { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

interface Aparelho {
  id: string
  codigo: string
  item: string
  modelo: string
  categoria?: string
}

interface SelectAparelhoProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  aparelhoSelecionado: Aparelho | null
  onAparelhoSelecionadoChange: (aparelho: Aparelho | null) => void
}

export const SelectAparelho: React.FC<SelectAparelhoProps> = ({
  onChange,
  disabled = false,
  aparelhoSelecionado,
  onAparelhoSelecionadoChange
}) => {
  const [aparelhos, setAparelhos] = useState<Aparelho[]>([])
  const [loading, setLoading] = useState(true)
  const [searchAparelho, setSearchAparelho] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAparelhos()
  }, [])

  // Preencher campo de busca quando aparelho está selecionado
  useEffect(() => {
    if (aparelhoSelecionado) {
      setSearchAparelho(`${aparelhoSelecionado.codigo} - ${aparelhoSelecionado.item}${aparelhoSelecionado.modelo ? ` (${aparelhoSelecionado.modelo})` : ''}`)
    }
  }, [aparelhoSelecionado])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAparelhos = async () => {
    if (!isSupabaseConfigured) {
      // Dados demo - incluindo aparelhos com e sem responsavel
      setAparelhos([
        { id: '1', codigo: 'CEL-001', item: 'iPhone 13', modelo: '128GB' },
        { id: '2', codigo: 'CEL-002', item: 'Samsung Galaxy S21', modelo: '256GB' },
        { id: '3', codigo: 'CEL-003', item: 'Motorola Edge', modelo: '128GB' }
      ])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // IMPORTANTE: Busca TODOS os itens do inventário
      // Não filtra por categoria - qualquer item pode ter uma linha telefônica
      // (celular, notebook com chip, tablet, etc)
      // Também não filtra por responsavel_id - itens podem estar vinculados a colaboradores
      const { data, error } = await supabase
        .from('itens')
        .select('id, codigo, item, modelo, categoria')
        .order('codigo', { ascending: true })

      if (error) {
        console.error('Erro ao buscar aparelhos:', error)
        return
      }

      setAparelhos(data || [])
    } catch (error) {
      console.error('Erro ao buscar aparelhos:', error)
    } finally {
      setLoading(false)
    }
  }

  const aparelhosFiltrados = aparelhos.filter(aparelho => {
    const searchTerm = searchAparelho.toLowerCase()
    return (
      aparelho.codigo.toLowerCase().includes(searchTerm) ||
      aparelho.item.toLowerCase().includes(searchTerm) ||
      (aparelho.modelo && aparelho.modelo.toLowerCase().includes(searchTerm)) ||
      (aparelho.categoria && aparelho.categoria.toLowerCase().includes(searchTerm))
    )
  })

  const handleSelectAparelho = (aparelho: Aparelho) => {
    onAparelhoSelecionadoChange(aparelho)
    onChange(aparelho.id)
    setSearchAparelho(`${aparelho.codigo} - ${aparelho.item}${aparelho.modelo ? ` (${aparelho.modelo})` : ''}`)
    setShowDropdown(false)
  }

  const handleClearAparelho = () => {
    onAparelhoSelecionadoChange(null)
    onChange(null)
    setSearchAparelho('')
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAparelho(e.target.value)
    setShowDropdown(true)
    if (!e.target.value) {
      handleClearAparelho()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={searchAparelho}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        disabled={disabled || loading}
        placeholder={loading ? "Carregando..." : "Buscar aparelho..."}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      
      {searchAparelho && !disabled && (
        <button
          type="button"
          onClick={handleClearAparelho}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}

      {showDropdown && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {aparelhosFiltrados.length > 0 ? (
            <>
              <div
                onClick={handleClearAparelho}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500 italic border-b"
              >
                Nenhum aparelho vinculado
              </div>
              {aparelhosFiltrados.map((aparelho) => (
                <div
                  key={aparelho.id}
                  onClick={() => handleSelectAparelho(aparelho)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {aparelho.codigo} - {aparelho.item}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {aparelho.modelo && <span>Modelo: {aparelho.modelo}</span>}
                    {aparelho.modelo && aparelho.categoria && <span> • </span>}
                    {aparelho.categoria && <span>Categoria: {aparelho.categoria}</span>}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 italic">
              Nenhum aparelho encontrado
            </div>
          )}
        </div>
      )}
    </div>
  )
}
