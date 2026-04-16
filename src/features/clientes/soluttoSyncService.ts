/**
 * SERVIÇO DE SINCRONIZAÇÃO SOLUTTO → NOSSO SISTEMA
 *
 * Fluxo: Solutto (somente leitura) → Edge Function → Supabase (escrita)
 * Jamais escreve ou altera dados na Solutto.
 */

import { supabase } from '../../lib/supabase'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// =====================================================
// TIPOS
// =====================================================

export interface ClienteSolutto {
  solutto_id: number
  codigo: string
  nome: string
  nome_fantasia: string
  email: string
  cpf: string
  cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  inscricao_estadual: string
  inscricao_municipal: string
  data_nascimento: string
  sexo: string
  obs: string
  status: 'ATIVO' | 'INATIVO'
}

export interface ProgressoSync {
  total: number
  processados: number
  atualizados: number
  criados: number
  erros: number
  mensagem: string
}

export interface ResultadoSync {
  total_solutto: number
  atualizados: number
  criados: number
  erros: number
  detalhes_erros: Array<{ nome: string; motivo: string }>
}

// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

/**
 * Obtém empresa_id do usuário autenticado.
 */
async function obterEmpresaId(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (error || !data?.empresa_id) {
    throw new Error('Usuário não possui empresa associada')
  }
  return data.empresa_id as number
}

/**
 * Busca clientes existentes na nossa base para construir o mapa de correspondência.
 * Retorna: Map de solutto_cliente_id → nosso id, e Map de cnpj → nosso id, e Map de cpf → nosso id
 */
async function carregarMapaExistentes(empresaId: number) {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, solutto_cliente_id, cnpj, cpf')
    .eq('empresa_id', empresaId)

  if (error) throw new Error(`Erro ao carregar clientes: ${error.message}`)

  const porSoluttoId = new Map<number, number>()
  const porCnpj      = new Map<string, number>()
  const porCpf       = new Map<string, number>()

  for (const c of (data || [])) {
    if (c.solutto_cliente_id) porSoluttoId.set(c.solutto_cliente_id, c.id)
    if (c.cnpj && c.cnpj.length > 0)  porCnpj.set(c.cnpj.replace(/\D/g, ''), c.id)
    if (c.cpf  && c.cpf.length  > 0)  porCpf.set(c.cpf.replace(/\D/g, ''),   c.id)
  }

  return { porSoluttoId, porCnpj, porCpf }
}

/**
 * Converte um ClienteSolutto nos campos da nossa tabela.
 */
/**
 * Converte um ClienteSolutto nos campos da nossa tabela.
 * Após relaxar as constraints, CPF e CNPJ são opcionais —
 * apenas o nome (razao_social / nome_completo) é obrigatório.
 */
function montarPayload(c: ClienteSolutto): Record<string, any> | null {
  const cnpjLimpo = c.cnpj.replace(/\D/g, '')
  const cpfLimpo  = c.cpf.replace(/\D/g, '')

  const temCnpj = cnpjLimpo.length >= 14
  const temCpf  = cpfLimpo.length  >= 11
  const temNome = !!(c.nome || c.nome_fantasia)

  // Sem nenhuma informação de identificação → descarta
  if (!temNome && !temCnpj && !temCpf) return null

  // PF: tem CPF válido e não tem CNPJ
  const tipoPessoa = (temCpf && !temCnpj) ? 'FISICA' : 'JURIDICA'

  const payload: Record<string, any> = {
    tipo_pessoa:         tipoPessoa,
    solutto_cliente_id:  c.solutto_id,
    status:              c.status,
    contribuinte_icms:   'NAO_CONTRIBUINTE',
    consumidor_final:    false,
    limite_credito:      0,
  }

  if (tipoPessoa === 'JURIDICA') {
    // chk_pessoa_juridica exige razao_social NOT NULL (cnpj agora é opcional)
    payload.razao_social = c.nome || c.nome_fantasia || `Empresa Solutto #${c.solutto_id}`
    if (temCnpj)               payload.cnpj                = cnpjLimpo
    if (c.nome_fantasia)       payload.nome_fantasia        = c.nome_fantasia
    if (c.inscricao_estadual)  payload.inscricao_estadual   = c.inscricao_estadual
    if (c.inscricao_municipal) payload.inscricao_municipal  = c.inscricao_municipal
  } else {
    // chk_pessoa_fisica exige nome_completo NOT NULL (cpf agora é opcional)
    payload.nome_completo = c.nome || c.nome_fantasia || `Cliente Solutto #${c.solutto_id}`
    if (temCpf)            payload.cpf            = cpfLimpo
    if (c.data_nascimento) payload.data_nascimento = c.data_nascimento
    if (c.sexo)            payload.genero          = c.sexo
  }

  if (c.obs) payload.observacoes = c.obs

  return payload
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Executa a sincronização: busca clientes na Solutto e atualiza/cria no nosso Supabase.
 * Jamais chama nenhum endpoint de escrita na Solutto.
 *
 * @param onProgress  Callback chamado a cada cliente processado
 * @param signal      AbortSignal para cancelamento
 */
export async function sincronizarClientesSolutto(
  onProgress: (p: ProgressoSync) => void,
  signal?: AbortSignal
): Promise<ResultadoSync> {
  // 1. Chama a Edge Function que busca os clientes na Solutto (somente leitura)
  onProgress({ total: 0, processados: 0, atualizados: 0, criados: 0, erros: 0, mensagem: 'Consultando Solutto...' })

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/solutto-sync-clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
    signal,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Erro ao consultar Solutto: ${resp.status} ${text.slice(0, 150)}`)
  }

  const { clientes, error } = await resp.json() as { clientes: ClienteSolutto[]; error?: string }

  if (error) throw new Error(error)
  if (!clientes || clientes.length === 0) {
    return { total_solutto: 0, atualizados: 0, criados: 0, erros: 0, detalhes_erros: [] }
  }

  // 2. Carrega mapa de clientes existentes no nosso Supabase
  onProgress({ total: clientes.length, processados: 0, atualizados: 0, criados: 0, erros: 0, mensagem: 'Carregando base local...' })

  const empresaId = await obterEmpresaId()
  const { porSoluttoId, porCnpj, porCpf } = await carregarMapaExistentes(empresaId)

  // 3. Processa cada cliente da Solutto
  let atualizados = 0
  let criados     = 0
  let erros       = 0
  const detalhes_erros: Array<{ nome: string; motivo: string }> = []

  for (let i = 0; i < clientes.length; i++) {
    if (signal?.aborted) break

    const c = clientes[i]
    const nome = c.nome || `ID Solutto ${c.solutto_id}`

    onProgress({
      total: clientes.length,
      processados: i,
      atualizados,
      criados,
      erros,
      mensagem: nome,
    })

    try {
      const payload = montarPayload(c)

      // Sem CPF nem CNPJ válido — não é possível inserir (constraint exige documento)
      if (!payload) {
        erros++
        detalhes_erros.push({ nome, motivo: 'Sem CPF ou CNPJ válido no Solutto — cliente ignorado' })
        continue
      }

      const cnpjLimpo = c.cnpj.replace(/\D/g, '')
      const cpfLimpo  = c.cpf.replace(/\D/g, '')

      // Tenta encontrar o cliente existente
      let idExistente: number | undefined =
        porSoluttoId.get(c.solutto_id) ??
        (cnpjLimpo.length >= 14 ? porCnpj.get(cnpjLimpo) : undefined) ??
        (cpfLimpo.length  >= 11 ? porCpf.get(cpfLimpo)   : undefined)

      if (idExistente) {
        // ATUALIZA — inclui status vindo da Solutto (367=ATIVO, 368=INATIVO)
        const { solutto_cliente_id, ...camposUpdate } = payload
        delete camposUpdate.limite_credito // não sobreescreve limite já configurado no sistema

        const { error: updateError } = await supabase
          .from('clientes')
          .update({ ...camposUpdate, solutto_cliente_id: c.solutto_id })
          .eq('id', idExistente)
          .eq('empresa_id', empresaId)

        if (updateError) throw new Error(updateError.message)
        atualizados++
      } else {
        // CRIA novo cliente
        const { error: insertError } = await supabase
          .from('clientes')
          .insert({ ...payload, empresa_id: empresaId })

        if (insertError) throw new Error(insertError.message)
        criados++
      }
    } catch (err) {
      erros++
      detalhes_erros.push({ nome, motivo: err instanceof Error ? err.message : String(err) })
      console.warn('[SoluttoSync] Erro ao processar cliente:', nome, err)
    }

    // Pequena pausa para não sobrecarregar o banco
    if (!signal?.aborted && i < clientes.length - 1) {
      await new Promise(r => setTimeout(r, 50))
    }
  }

  return { total_solutto: clientes.length, atualizados, criados, erros, detalhes_erros }
}
