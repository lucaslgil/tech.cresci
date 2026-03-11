// =====================================================
// TIPOS - MÓDULO DE PARÂMETROS FRANQUIA
// =====================================================

export type TipoParametro = 'status' | 'etapa' | 'modalidade' | 'tipo_contrato'

export interface ParametroFranquia {
  id: string
  empresa_id: string
  tipo: TipoParametro
  label: string
  cor: string | null
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface FormParametro {
  tipo: TipoParametro
  label: string
  cor: string
  ordem: string
  ativo: boolean
}

export const INITIAL_FORM_PARAMETRO: FormParametro = {
  tipo: 'status',
  label: '',
  cor: '',
  ordem: '0',
  ativo: true,
}

export const TIPO_PARAMETRO_LABELS: Record<TipoParametro, string> = {
  status:        'Status',
  etapa:         'Etapa Atual',
  modalidade:    'Modalidade',
  tipo_contrato: 'Tipo de Contrato',
}
