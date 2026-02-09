/**
 * SERVIÇOS DE API - MÓDULO DE CLIENTES
 * Camada de integração com Supabase
 */

import { supabase } from '../../lib/supabase'
import { logger } from '../../utils/logger'
import { sanitizeText, onlyNumbers } from '../../utils/sanitizer'
import type {
  Cliente,
  ClienteEndereco,
  ClienteContato,
  ClienteHistorico,
  ClienteCompleto,
  ClienteFiltros,
  CondicaoPagamento,
  TabelaPreco
} from './types'

// =====================================================
// CAMPOS PERMITIDOS NA TABELA
// =====================================================

/**
 * Campos permitidos na tabela clientes (baseado no schema SQL)
 */
const CAMPOS_CLIENTES = [
  'tipo_pessoa',
  'nome_completo', 'cpf', 'rg', 'data_nascimento', 'genero',
  'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'inscricao_municipal', 'cnae_principal',
  'regime_tributario', 'contribuinte_icms', 'consumidor_final', 'codigo_suframa', 'tipo_contribuinte_id',
  'limite_credito', 'condicao_pagamento_id', 'tabela_preco_id',
  'status', 'bloqueio', 'motivo_bloqueio', 'data_bloqueio',
  'observacoes', 'observacoes_internas',
  'created_by', 'updated_by', 'ultimo_vendedor_id'
]

/**
 * Filtra apenas os campos que existem na tabela clientes
 */
function filtrarCamposCliente(dados: any): any {
  const dadosFiltrados: any = {}
  
  CAMPOS_CLIENTES.forEach(campo => {
    if (dados[campo] !== undefined) {
      dadosFiltrados[campo] = dados[campo]
    }
  })
  
  return dadosFiltrados
}

// =====================================================
// CLIENTES - CRUD
// =====================================================

/**
 * Lista clientes com filtros e paginação
 */
export async function listarClientes(filtros?: ClienteFiltros) {
  try {
    let query = supabase
      .from('clientes')
      .select(`
        *,
        enderecos:clientes_enderecos(count),
        contatos:clientes_contatos(count)
      `)

    // Aplicar filtros
    if (filtros?.busca) {
      const termo = `%${filtros.busca}%`
      query = query.or(`nome_completo.ilike.${termo},razao_social.ilike.${termo},nome_fantasia.ilike.${termo},cpf.ilike.${termo},cnpj.ilike.${termo},codigo.ilike.${termo}`)
    }

    if (filtros?.tipo_pessoa) {
      query = query.eq('tipo_pessoa', filtros.tipo_pessoa)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.bloqueado !== undefined) {
      query = query.eq('bloqueado', filtros.bloqueado)
    }

    if (filtros?.estado) {
      query = query.contains('clientes_enderecos', { estado: filtros.estado })
    }

    if (filtros?.cidade) {
      query = query.contains('clientes_enderecos', { cidade: filtros.cidade })
    }

    if (filtros?.condicao_pagamento_id) {
      query = query.eq('condicao_pagamento_id', filtros.condicao_pagamento_id)
    }

    if (filtros?.tabela_preco_id) {
      query = query.eq('tabela_preco_id', filtros.tabela_preco_id)
    }

    // Ordenação
    const ordem = filtros?.ordenar_por || 'nome_completo'
    const direcao = filtros?.ordem_direcao || 'asc'
    query = query.order(ordem, { ascending: direcao === 'asc' })

    // Paginação
    if (filtros?.limite) {
      const inicio = filtros.offset || 0
      query = query.range(inicio, inicio + filtros.limite - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data as Cliente[],
      total: count || 0
    }
  } catch (error) {
    console.error('Erro ao listar clientes:', error)
    throw error
  }
}

/**
 * Busca cliente por ID (completo com joins)
 */
export async function buscarClienteCompleto(id: string) {
  try {
    const { data, error } = await supabase
      .from('vw_clientes_completo')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Buscar endereços e contatos separadamente
    const { data: enderecos } = await supabase
      .from('clientes_enderecos')
      .select('*')
      .eq('cliente_id', id)
      .order('principal', { ascending: false })

    const { data: contatos } = await supabase
      .from('clientes_contatos')
      .select('*')
      .eq('cliente_id', id)
      .order('principal', { ascending: false })

    return {
      ...data,
      enderecos: enderecos || [],
      contatos: contatos || []
    } as ClienteCompleto
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    throw error
  }
}

/**
 * Busca cliente por ID (apenas dados principais)
 */
export async function buscarCliente(id: string) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return data as Cliente
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    throw error
  }
}

/**
 * Busca cliente por CPF
 */
export async function buscarClientePorCPF(cpf: string) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf', cpf.replace(/\D/g, ''))
      .maybeSingle()

    if (error) throw error

    return data as Cliente | null
  } catch (error) {
    console.error('Erro ao buscar cliente por CPF:', error)
    throw error
  }
}

/**
 * Busca cliente por CNPJ
 */
export async function buscarClientePorCNPJ(cnpj: string) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cnpj', cnpj.replace(/\D/g, ''))
      .maybeSingle()

    if (error) throw error

    return data as Cliente | null
  } catch (error) {
    console.error('Erro ao buscar cliente por CNPJ:', error)
    throw error
  }
}

/**
 * Cria novo cliente
 */
export async function criarCliente(cliente: Partial<Cliente>) {
  try {
    // Filtra apenas os campos que existem na tabela
    const dadosCliente = filtrarCamposCliente(cliente)

    // ✅ SEGURANÇA: Sanitizar dados antes de inserir
    if (dadosCliente.nome_completo) {
      dadosCliente.nome_completo = sanitizeText(dadosCliente.nome_completo)
    }
    if (dadosCliente.razao_social) {
      dadosCliente.razao_social = sanitizeText(dadosCliente.razao_social)
    }
    if (dadosCliente.nome_fantasia) {
      dadosCliente.nome_fantasia = sanitizeText(dadosCliente.nome_fantasia)
    }
    if (dadosCliente.cpf) {
      dadosCliente.cpf = onlyNumbers(dadosCliente.cpf)
    }
    if (dadosCliente.cnpj) {
      dadosCliente.cnpj = onlyNumbers(dadosCliente.cnpj)
    }
    if (dadosCliente.observacoes) {
      dadosCliente.observacoes = sanitizeText(dadosCliente.observacoes)
    }
    if (dadosCliente.observacoes_internas) {
      dadosCliente.observacoes_internas = sanitizeText(dadosCliente.observacoes_internas)
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert(dadosCliente)
      .select()
      .single()

    if (error) throw error

    logger.info('Cliente criado', { id: data.id })
    return data as Cliente
  } catch (error) {
    logger.error('Erro ao criar cliente', error)
    throw error
  }
}

/**
 * Atualiza cliente
 */
export async function atualizarCliente(id: string, cliente: Partial<Cliente>) {
  try {
    // Filtra apenas os campos que existem na tabela
    const dadosCliente = filtrarCamposCliente(cliente)

    // ✅ SEGURANÇA: Sanitizar dados antes de atualizar
    if (dadosCliente.nome_completo) {
      dadosCliente.nome_completo = sanitizeText(dadosCliente.nome_completo)
    }
    if (dadosCliente.razao_social) {
      dadosCliente.razao_social = sanitizeText(dadosCliente.razao_social)
    }
    if (dadosCliente.nome_fantasia) {
      dadosCliente.nome_fantasia = sanitizeText(dadosCliente.nome_fantasia)
    }
    if (dadosCliente.cpf) {
      dadosCliente.cpf = onlyNumbers(dadosCliente.cpf)
    }
    if (dadosCliente.cnpj) {
      dadosCliente.cnpj = onlyNumbers(dadosCliente.cnpj)
    }
    if (dadosCliente.observacoes) {
      dadosCliente.observacoes = sanitizeText(dadosCliente.observacoes)
    }
    if (dadosCliente.observacoes_internas) {
      dadosCliente.observacoes_internas = sanitizeText(dadosCliente.observacoes_internas)
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(dadosCliente)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info('Cliente atualizado', { id })
    return data as Cliente
  } catch (error) {
    logger.error('Erro ao atualizar cliente', error)
    throw error
  }
}

/**
 * Exclui cliente (soft delete)
 */
export async function excluirCliente(id: string) {
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ status: 'INATIVO' })
      .eq('id', id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    throw error
  }
}

/**
 * Bloqueia/desbloqueia cliente
 */
export async function bloquearCliente(id: string, bloqueado: boolean, motivo?: string, tipo_bloqueio?: string) {
  try {
    const dados: any = { bloqueado }

    if (bloqueado) {
      dados.bloqueio_motivo = motivo
      dados.bloqueio_tipo = tipo_bloqueio
      dados.bloqueio_data = new Date().toISOString()
    } else {
      dados.bloqueio_motivo = null
      dados.bloqueio_tipo = null
      dados.bloqueio_data = null
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as Cliente
  } catch (error) {
    console.error('Erro ao bloquear/desbloquear cliente:', error)
    throw error
  }
}

// =====================================================
// ENDEREÇOS
// =====================================================

/**
 * Lista endereços de um cliente
 */
export async function listarEnderecos(clienteId: string) {
  try {
    const { data, error } = await supabase
      .from('clientes_enderecos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('principal', { ascending: false })
      .order('tipo')

    if (error) throw error

    return data as ClienteEndereco[]
  } catch (error) {
    console.error('Erro ao listar endereços:', error)
    throw error
  }
}

/**
 * Busca endereço por ID
 */
export async function buscarEndereco(id: string) {
  try {
    const { data, error } = await supabase
      .from('clientes_enderecos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return data as ClienteEndereco
  } catch (error) {
    console.error('Erro ao buscar endereço:', error)
    throw error
  }
}

/**
 * Cria novo endereço
 */
export async function criarEndereco(endereco: Partial<ClienteEndereco>) {
  try {
    const { id, created_at, updated_at, ...dadosEndereco } = endereco as any

    const { data, error } = await supabase
      .from('clientes_enderecos')
      .insert(dadosEndereco)
      .select()
      .single()

    if (error) throw error

    return data as ClienteEndereco
  } catch (error) {
    console.error('Erro ao criar endereço:', error)
    throw error
  }
}

/**
 * Atualiza endereço
 */
export async function atualizarEndereco(id: string, endereco: Partial<ClienteEndereco>) {
  try {
    const { id: _, created_at, updated_at, cliente_id, ...dadosEndereco } = endereco as any

    const { data, error } = await supabase
      .from('clientes_enderecos')
      .update(dadosEndereco)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as ClienteEndereco
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error)
    throw error
  }
}

/**
 * Exclui endereço
 */
export async function excluirEndereco(id: string) {
  try {
    const { error } = await supabase
      .from('clientes_enderecos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Erro ao excluir endereço:', error)
    throw error
  }
}

/**
 * Define endereço como principal
 */
export async function definirEnderecoPrincipal(id: string, clienteId: string) {
  try {
    // Remove principal de outros endereços
    await supabase
      .from('clientes_enderecos')
      .update({ principal: false })
      .eq('cliente_id', clienteId)

    // Define este como principal
    const { data, error } = await supabase
      .from('clientes_enderecos')
      .update({ principal: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as ClienteEndereco
  } catch (error) {
    console.error('Erro ao definir endereço principal:', error)
    throw error
  }
}

// =====================================================
// CONTATOS
// =====================================================

/**
 * Lista contatos de um cliente
 */
export async function listarContatos(clienteId: string) {
  try {
    const { data, error } = await supabase
      .from('clientes_contatos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('principal', { ascending: false })
      .order('tipo')

    if (error) throw error

    return data as ClienteContato[]
  } catch (error) {
    console.error('Erro ao listar contatos:', error)
    throw error
  }
}

/**
 * Busca contato por ID
 */
export async function buscarContato(id: string) {
  try {
    const { data, error } = await supabase
      .from('clientes_contatos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return data as ClienteContato
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    throw error
  }
}

/**
 * Cria novo contato
 */
export async function criarContato(contato: Partial<ClienteContato>) {
  try {
    const { id, created_at, updated_at, ...dadosContato } = contato as any

    const { data, error } = await supabase
      .from('clientes_contatos')
      .insert(dadosContato)
      .select()
      .single()

    if (error) throw error

    return data as ClienteContato
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    throw error
  }
}

/**
 * Atualiza contato
 */
export async function atualizarContato(id: string, contato: Partial<ClienteContato>) {
  try {
    const { id: _, created_at, updated_at, cliente_id, ...dadosContato } = contato as any

    const { data, error } = await supabase
      .from('clientes_contatos')
      .update(dadosContato)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as ClienteContato
  } catch (error) {
    console.error('Erro ao atualizar contato:', error)
    throw error
  }
}

/**
 * Exclui contato
 */
export async function excluirContato(id: string) {
  try {
    const { error } = await supabase
      .from('clientes_contatos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Erro ao excluir contato:', error)
    throw error
  }
}

/**
 * Define contato como principal
 */
export async function definirContatoPrincipal(id: string, clienteId: string) {
  try {
    // Remove principal de outros contatos
    await supabase
      .from('clientes_contatos')
      .update({ principal: false })
      .eq('cliente_id', clienteId)

    // Define este como principal
    const { data, error } = await supabase
      .from('clientes_contatos')
      .update({ principal: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as ClienteContato
  } catch (error) {
    console.error('Erro ao definir contato principal:', error)
    throw error
  }
}

// =====================================================
// HISTÓRICO
// =====================================================

/**
 * Lista histórico de um cliente
 */
export async function listarHistorico(clienteId: string) {
  try {
    const { data, error } = await supabase
      .from('clientes_historico')
      .select(`
        *,
        usuario:usuario_id(nome_completo)
      `)
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as ClienteHistorico[]
  } catch (error) {
    console.error('Erro ao listar histórico:', error)
    throw error
  }
}

/**
 * Adiciona entrada no histórico
 */
export async function adicionarHistorico(
  clienteId: string,
  tipo: string,
  descricao: string,
  usuarioId?: string
) {
  try {
    const { data, error } = await supabase
      .from('clientes_historico')
      .insert({
        cliente_id: clienteId,
        tipo,
        descricao,
        usuario_id: usuarioId
      })
      .select()
      .single()

    if (error) throw error

    return data as ClienteHistorico
  } catch (error) {
    console.error('Erro ao adicionar histórico:', error)
    throw error
  }
}

// =====================================================
// CONDIÇÕES DE PAGAMENTO
// =====================================================

/**
 * Lista condições de pagamento
 */
export async function listarCondicoesPagamento() {
  try {
    const { data, error } = await supabase
      .from('condicoes_pagamento')
      .select('*')
      .eq('ativo', true)
      .order('descricao')

    if (error) throw error

    return data as CondicaoPagamento[]
  } catch (error) {
    console.error('Erro ao listar condições de pagamento:', error)
    throw error
  }
}

// =====================================================
// TABELAS DE PREÇO
// =====================================================

/**
 * Lista tabelas de preço
 */
export async function listarTabelasPreco() {
  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .select('*')
      .eq('ativo', true)
      .order('descricao')

    if (error) throw error

    return data as TabelaPreco[]
  } catch (error) {
    console.error('Erro ao listar tabelas de preço:', error)
    throw error
  }
}

// =====================================================
// ESTATÍSTICAS E DASHBOARDS
// =====================================================

/**
 * Busca estatísticas de clientes
 */
export async function buscarEstatisticas() {
  try {
    // Total de clientes
    const { count: total } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })

    // Clientes ativos
    const { count: ativos } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ATIVO')

    // Clientes bloqueados
    const { count: bloqueados } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('bloqueado', true)

    // Pessoa Física vs Jurídica
    const { count: pessoaFisica } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_pessoa', 'FISICA')

    const { count: pessoaJuridica } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_pessoa', 'JURIDICA')

    return {
      total: total || 0,
      ativos: ativos || 0,
      bloqueados: bloqueados || 0,
      pessoaFisica: pessoaFisica || 0,
      pessoaJuridica: pessoaJuridica || 0,
      inativos: (total || 0) - (ativos || 0)
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    throw error
  }
}

/**
 * Busca clientes recentes
 */
export async function buscarClientesRecentes(limite: number = 5) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, codigo, nome_completo, razao_social, tipo_pessoa, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) throw error

    return data as Partial<Cliente>[]
  } catch (error) {
    console.error('Erro ao buscar clientes recentes:', error)
    throw error
  }
}
