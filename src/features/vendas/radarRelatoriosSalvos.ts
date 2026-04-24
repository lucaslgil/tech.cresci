/**
 * SERVIÇO - RELATÓRIOS DO RADAR DE INATIVIDADE SALVOS
 * Persiste relatórios consultados no localStorage do navegador.
 */

import type { ResultadoRadar } from './radarInativiadeService'

const STORAGE_KEY = 'radar_relatorios_salvos'
const MAX_RELATORIOS = 20

// =====================================================
// TIPOS
// =====================================================

export interface RelatorioSalvo {
  id: string
  titulo: string
  data_gravacao: string
  resumo: string   // ex: "42 clientes · 01/01/2025 – 30/01/2025"
  resultado: ResultadoRadar
}

// =====================================================
// HELPERS
// =====================================================

function gerarId(): string {
  return `radar_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// =====================================================
// API PÚBLICA
// =====================================================

export function listarRelatoriosSalvos(): RelatorioSalvo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RelatorioSalvo[]
  } catch {
    return []
  }
}

export function salvarRelatorio(
  titulo: string,
  resumo: string,
  resultado: ResultadoRadar
): RelatorioSalvo {
  const novo: RelatorioSalvo = {
    id: gerarId(),
    titulo: titulo.trim() || 'Relatório sem título',
    data_gravacao: new Date().toISOString(),
    resumo,
    resultado,
  }

  const lista = listarRelatoriosSalvos()
  // Insere no topo e limita ao máximo
  const atualizada = [novo, ...lista].slice(0, MAX_RELATORIOS)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada))
  } catch {
    // localStorage cheio: tenta remover o mais antigo e reinserir
    try {
      const reduzida = [novo, ...lista.slice(0, MAX_RELATORIOS - 2)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduzida))
    } catch {
      // ignora silenciosamente
    }
  }

  return novo
}

export function excluirRelatorio(id: string): void {
  const lista = listarRelatoriosSalvos().filter(r => r.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  } catch {
    // ignora
  }
}
