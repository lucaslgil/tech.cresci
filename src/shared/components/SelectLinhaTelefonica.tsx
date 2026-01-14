import React, { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

interface LinhaTelefonica {
  id: string
  numero_linha: string
  tipo: string
  operadora: string
}

interface SelectLinhaTelefonicaProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  linhaSelecionada: LinhaTelefonica | null
  onLinhaSelecionadaChange: (linha: LinhaTelefonica | null) => void
}

export const SelectLinhaTelefonica: React.FC<SelectLinhaTelefonicaProps> = ({
  onChange,
  disabled = false,
  linhaSelecionada,
  onLinhaSelecionadaChange
}) => {
  const [linhas, setLinhas] = useState<LinhaTelefonica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLinha, setSearchLinha] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchLinhas()
  }, [])

  // Preencher campo de busca quando linha está selecionada
  useEffect(() => {
    if (linhaSelecionada) {
      setSearchLinha(`${linhaSelecionada.numero_linha} - ${linhaSelecionada.tipo} (${linhaSelecionada.operadora})`)
    }
  }, [linhaSelecionada])

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

  const fetchLinhas = async () => {
    if (!isSupabaseConfigured) {
      // Dados demo
      setLinhas([
        { id: '1', numero_linha: '(11) 98765-4321', tipo: 'eSIM', operadora: 'Vivo' },
        { id: '2', numero_linha: '(11) 97654-3210', tipo: 'Chip Físico', operadora: 'Claro' },
        { id: '3', numero_linha: '(11) 96543-2109', tipo: 'eSIM', operadora: 'Tim' },
        { id: '4', numero_linha: '(11) 95432-1098', tipo: 'Chip Físico', operadora: 'Oi' }
      ])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('linhas_telefonicas')
        .select('id, numero_linha, tipo, operadora')
        .order('numero_linha', { ascending: true })

      if (error) {
        console.error('Erro ao buscar linhas telefônicas:', error)
        return
      }

      setLinhas(data || [])
    } catch (error) {
      console.error('Erro ao buscar linhas telefônicas:', error)
    } finally {
      setLoading(false)
    }
  }

  const linhasFiltradas = linhas.filter(linha => {
    const searchTerm = searchLinha.toLowerCase()
    return (
      linha.numero_linha.toLowerCase().includes(searchTerm) ||
      linha.tipo.toLowerCase().includes(searchTerm) ||
      linha.operadora.toLowerCase().includes(searchTerm)
    )
  })

  const handleSelectLinha = (linha: LinhaTelefonica) => {
    onLinhaSelecionadaChange(linha)
    onChange(linha.id)
    setSearchLinha(`${linha.numero_linha} - ${linha.tipo} (${linha.operadora})`)
    setShowDropdown(false)
  }

  const handleClearLinha = () => {
    onLinhaSelecionadaChange(null)
    onChange(null)
    setSearchLinha('')
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchLinha(e.target.value)
    setShowDropdown(true)
    if (!e.target.value) {
      handleClearLinha()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={searchLinha}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        disabled={disabled || loading}
        placeholder={loading ? "Carregando..." : "Buscar linha telefônica..."}
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        style={{ borderColor: '#C9C4B5' }}
      />
      
      {searchLinha && !disabled && (
        <button
          type="button"
          onClick={handleClearLinha}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}

      {showDropdown && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {linhasFiltradas.length > 0 ? (
            <>
              <div
                onClick={handleClearLinha}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500 italic border-b"
              >
                Nenhuma linha selecionada
              </div>
              {linhasFiltradas.map((linha) => (
                <div
                  key={linha.id}
                  onClick={() => handleSelectLinha(linha)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {linha.numero_linha}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {linha.tipo} • {linha.operadora}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 italic">
              Nenhuma linha encontrada
            </div>
          )}
        </div>
      )}
    </div>
  )
}
