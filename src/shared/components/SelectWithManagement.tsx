import React, { useState } from 'react'

interface SelectWithManagementProps {
  label: string
  name: string
  value: string
  options: string[]
  onOptionChange?: (newOptions: string[]) => void
  onAddOption?: (newOption: string) => Promise<void>
  onRemoveOption?: (option: string) => Promise<void>
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder: string
  required?: boolean
}

export const SelectWithManagement: React.FC<SelectWithManagementProps> = ({
  label,
  name,
  value,
  options,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onChange,
  placeholder,
  required = false
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [selectedForRemoval, setSelectedForRemoval] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddOption = async () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setLoading(true)
      try {
        if (onAddOption) {
          await onAddOption(newOption.trim())
        } else if (onOptionChange) {
          const updatedOptions = [...options, newOption.trim()].sort()
          onOptionChange(updatedOptions)
        }
        setNewOption('')
        setShowAddModal(false)
      } catch (error) {
        console.error('Erro ao adicionar opção:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRemoveOption = async () => {
    if (selectedForRemoval) {
      setLoading(true)
      try {
        if (onRemoveOption) {
          await onRemoveOption(selectedForRemoval)
        } else if (onOptionChange) {
          const updatedOptions = options.filter(option => option !== selectedForRemoval)
          onOptionChange(updatedOptions)
        }
        setSelectedForRemoval('')
        setShowRemoveModal(false)
      } catch (error) {
        console.error('Erro ao remover opção:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs text-slate-600 hover:text-slate-800 px-2 py-1 border border-slate-300 rounded-md hover:bg-slate-50"
            title={`Adicionar nova ${label.toLowerCase()}`}
          >
            + Adicionar
          </button>
          <button
            type="button"
            onClick={() => setShowRemoveModal(true)}
            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded-md hover:bg-red-50"
            title={`Remover ${label.toLowerCase()}`}
          >
            - Remover
          </button>
        </div>
      </div>

      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Modal para adicionar nova opção */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Adicionar Nova {label}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewOption('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da {label}
              </label>
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                placeholder={`Digite o nome da nova ${label.toLowerCase()}`}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setNewOption('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddOption}
                disabled={!newOption.trim() || options.includes(newOption.trim()) || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 border border-transparent rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para remover opção */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Remover {label}
              </h3>
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedForRemoval('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a {label} para remover
              </label>
              <select
                value={selectedForRemoval}
                onChange={(e) => setSelectedForRemoval(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Selecione...</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {selectedForRemoval && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita. A {label.toLowerCase()} "{selectedForRemoval}" será removida permanentemente.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedForRemoval('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemoveOption}
                disabled={!selectedForRemoval || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}