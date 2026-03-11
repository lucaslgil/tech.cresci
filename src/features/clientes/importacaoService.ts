/**
 * SERVIÇO DE IMPORTAÇÃO DE CLIENTES EM LOTE
 * Estratégia: UPSERT separado por tipo (PJ/PF) para máxima compatibilidade
 */

import { supabase } from '../../lib/supabase'
import { logger } from '../../utils/logger'
import { sanitizeText, onlyNumbers } from '../../utils/sanitizer'
import { consultarCEP } from './utils'
import type { ClienteFormData } from './types'

interface ImportacaoResult {
  sucesso: number
  erros: Array<{ linha: number; cliente: string; erro: string }>
  clientesImportados: string[]
}

interface ClientePreparado {
  linha: number
  nome: string
  dados: Record<string, any>
  tipoPessoa: 'FISICA' | 'JURIDICA'
  documento: string // cnpj ou cpf (já normalizado)
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    codigo_municipio?: string
  }
}

export interface ProgressoCallback {
  etapa: 'validacao' | 'verificacao' | 'insercao' | 'atualizacao' | 'finalizacao'
  processados: number
  total: number
  sucessos: number
  erros: number
  mensagem: string
}

/**
 * Obtém empresa_id do usuário autenticado
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
    throw new Error('Usuário não possui empresa associada. Verifique seu cadastro.')
  }
  return data.empresa_id
}

/**
 * Insere ou atualiza UM cliente.
 * Estratégia: tenta INSERT → se conflito 23505 → faz UPDATE
 */
async function upsertCliente(
  dados: Record<string, any>,
  empresaId: number,
  documento: string,
  tipoPessoa: 'FISICA' | 'JURIDICA'
): Promise<{ ok: boolean; erro?: string; clienteId?: number }> {
  const payload: Record<string, any> = { ...dados, empresa_id: empresaId }

  // Remove campos undefined/null/vazios
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
      delete payload[key]
    }
  })

  // 1ª tentativa: INSERT
  const { data: insertData, error: insertError } = await supabase
    .from('clientes')
    .insert(payload)
    .select('id')
    .single()

  if (!insertError) {
    return { ok: true, clienteId: insertData?.id }
  }

  // Se for conflito de unique constraint (código 23505) → tenta UPDATE
  const eConflito = insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')

  if (eConflito) {
    // Busca o ID existente pelo documento
    let queryExistente = supabase.from('clientes').select('id').eq('empresa_id', empresaId)
    if (tipoPessoa === 'JURIDICA') {
      queryExistente = queryExistente.eq('cnpj', documento)
    } else {
      queryExistente = queryExistente.eq('cpf', documento)
    }

    const { data: existente } = await queryExistente.maybeSingle()

    if (existente?.id) {
      // UPDATE com os novos dados (sem alterar empresa_id nem documento)
      const dadosUpdate: Record<string, any> = { ...payload }
      delete dadosUpdate['empresa_id']
      delete dadosUpdate['cnpj']
      delete dadosUpdate['cpf']

      const { error: updateError } = await supabase
        .from('clientes')
        .update(dadosUpdate)
        .eq('id', existente.id)
        .eq('empresa_id', empresaId)

      if (!updateError) {
        return { ok: true, clienteId: existente.id }
      }
      return { ok: false, erro: `Erro ao atualizar: ${updateError.message}` }
    }

    // Conflito mas não encontrou → tenta upsert direto pelo documento e busca ID
    const conflictCol = tipoPessoa === 'JURIDICA' ? 'cnpj' : 'cpf'
    const { data: upsertData, error: upsertError } = await supabase
      .from('clientes')
      .upsert(payload, { onConflict: conflictCol, ignoreDuplicates: false })
      .select('id')
      .single()

    if (!upsertError) {
      return { ok: true, clienteId: upsertData?.id }
    }
    return { ok: false, erro: `Conflito nao resolvido: ${upsertError.message}` }
  }

  return { ok: false, erro: insertError.message || 'Erro desconhecido ao inserir' }
}

/**
 * Normaliza CEP: pode vir como número do Excel (ex: 1310100 → "01310-100")
 * ou como string. Retorna apenas dígitos, com zero à esquerda para 8 dígitos.
 */
function normalizarCep(valor: any): string {
  if (!valor && valor !== 0) return ''
  const digits = String(valor).replace(/\D/g, '').replace(/\.0+$/, '')
  return digits.padStart(8, '0').substring(0, 8)
}

/**
 * Insere endereço principal de importação para um cliente.
 * Não sobrescreve se o cliente já tiver endereço principal.
 * Loga erros em vez de engoli-los silenciosamente.
 */
async function inserirEnderecoImportacao(
  clienteId: number,
  endereco: NonNullable<ClientePreparado['endereco']>
): Promise<void> {
  // Verifica se já existe endereço principal
  const { data: existente } = await supabase
    .from('clientes_enderecos')
    .select('id, logradouro, numero, bairro, cidade, estado, codigo_municipio')
    .eq('cliente_id', clienteId)
    .eq('principal', true)
    .maybeSingle()

  // Normaliza campos vindos da planilha
  const cepNorm = normalizarCep(endereco.cep)

  let logradouro = (endereco.logradouro || '').trim()
  let numero     = (endereco.numero || '').trim()
  let bairro     = (endereco.bairro || '').trim()
  let cidade     = (endereco.cidade || '').trim()
  let estado     = (endereco.estado || '').trim().toUpperCase()
  let codigoMunicipio = (endereco.codigo_municipio || '').trim()

  // Consulta ViaCEP para campos que ainda não vieram na planilha
  const precisaConsultarCEP = cepNorm && cepNorm.length === 8 && (!logradouro || !bairro || !cidade)
  if (precisaConsultarCEP) {
    try {
      const dadosCEP = await consultarCEP(cepNorm)
      if (dadosCEP) {
        if (!logradouro && dadosCEP.logradouro) logradouro = dadosCEP.logradouro
        if (!bairro     && dadosCEP.bairro)     bairro     = dadosCEP.bairro
        if (!cidade     && dadosCEP.localidade) cidade     = dadosCEP.localidade
        if (!estado     && dadosCEP.uf)         estado     = dadosCEP.uf.toUpperCase()
        if (!codigoMunicipio && dadosCEP.ibge)  codigoMunicipio = dadosCEP.ibge
      }
    } catch (e) {
      logger.warn('Falha ao consultar ViaCEP durante importação', { cep: cepNorm })
    }
  }

  const payload: Record<string, any> = {
    cliente_id: clienteId,
    tipo: 'ENTREGA',
    principal: true,
    pais: 'Brasil',
    cep:        cepNorm || '00000000',
    logradouro: logradouro || 'Não informado',
    numero:     numero || 'S/N',
    bairro:     bairro || 'Não informado',
    cidade:     cidade || 'Não informado',
    estado:     estado || 'XX',
  }

  if (codigoMunicipio) payload.codigo_municipio = codigoMunicipio
  if (endereco.complemento && endereco.complemento.trim()) {
    payload.complemento = endereco.complemento.trim()
  }

  if (existente?.id) {
    // Já existe → UPDATE com dados da planilha
    // Monta apenas os campos que a planilha forneceu com valores reais
    const patch: Record<string, any> = {}

    if (cepNorm) patch.cep = cepNorm
    if (logradouro) patch.logradouro = logradouro
    if (numero)     patch.numero     = numero
    if (bairro)     patch.bairro     = bairro
    if (cidade)     patch.cidade     = cidade
    if (estado)     patch.estado     = estado
    if (codigoMunicipio) patch.codigo_municipio = codigoMunicipio
    if (endereco.complemento?.trim()) patch.complemento = endereco.complemento.trim()

    if (Object.keys(patch).length === 0) return

    const { error } = await supabase
      .from('clientes_enderecos')
      .update(patch)
      .eq('id', existente.id)

    if (error) {
      logger.warn('Erro ao atualizar endereço na importação', {
        clienteId, enderecoId: existente.id, erro: error.message, patch,
      })
    }
  } else {
    // Não existe → INSERT
    const { error } = await supabase.from('clientes_enderecos').insert(payload)

    if (error) {
      logger.warn('Erro ao inserir endereço na importação', {
        clienteId, erro: error.message, payload,
      })
    }
  }
}

/**
 * Função principal: importa clientes em lote
 */
export async function importarClientesEmLote(
  clientes: ClienteFormData[],
  onProgress?: (progresso: ProgressoCallback) => void
): Promise<ImportacaoResult> {
  const totalEntrada = clientes.length
  const erros: ImportacaoResult['erros'] = []
  const clientesImportados: string[] = []
  let totalSucessos = 0
  let totalErros = 0

  logger.info('Iniciando importacao em lote', { total: totalEntrada })

  try {
    // ── ETAPA 1: Obter empresa_id ────────────────────────────────
    const empresaId = await obterEmpresaId()

    // ── ETAPA 2: VALIDAR E NORMALIZAR ────────────────────────────
    const clientesPreparados: ClientePreparado[] = []

    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i]
      const linha = i + 2
      const nome = c.razao_social || c.nome_completo || `Linha ${linha}`
      const tipo = String(c.tipo_pessoa || '').toUpperCase() as 'FISICA' | 'JURIDICA'

      // Normalizar documento
      const cnpjRaw = c.cnpj ? onlyNumbers(String(c.cnpj)) : ''
      const cpfRaw = c.cpf ? onlyNumbers(String(c.cpf)) : ''

      // Validação de documento
      if (tipo === 'JURIDICA') {
        if (cnpjRaw.length < 14) {
          erros.push({ linha, cliente: nome, erro: `CNPJ inválido: "${c.cnpj}" (${cnpjRaw.length} dígitos, esperado 14)` })
          totalErros++
          onProgress?.({ etapa: 'validacao', processados: i + 1, total: totalEntrada, sucessos: clientesPreparados.length, erros: totalErros, mensagem: `Validando ${i + 1}/${totalEntrada}...` })
          continue
        }
      } else {
        if (cpfRaw.length < 11) {
          erros.push({ linha, cliente: nome, erro: `CPF inválido: "${c.cpf}" (${cpfRaw.length} dígitos, esperado 11)` })
          totalErros++
          onProgress?.({ etapa: 'validacao', processados: i + 1, total: totalEntrada, sucessos: clientesPreparados.length, erros: totalErros, mensagem: `Validando ${i + 1}/${totalEntrada}...` })
          continue
        }
      }

      // Montar payload limpo
      const dados: Record<string, any> = {
        tipo_pessoa: tipo,
        status: String(c.status || 'ATIVO').trim().toUpperCase(),
        consumidor_final: Boolean(c.consumidor_final),
      }

      if (tipo === 'FISICA') {
        dados.nome_completo = c.nome_completo ? sanitizeText(c.nome_completo) : undefined
        dados.cpf = cpfRaw
        if (c.data_nascimento) dados.data_nascimento = c.data_nascimento
      } else {
        dados.razao_social = c.razao_social ? sanitizeText(c.razao_social) : undefined
        dados.cnpj = cnpjRaw
        if (c.nome_fantasia) dados.nome_fantasia = sanitizeText(c.nome_fantasia)
        if (c.inscricao_estadual) dados.inscricao_estadual = c.inscricao_estadual
      }

      if (c.regime_tributario) dados.regime_tributario = c.regime_tributario
      if (c.contribuinte_icms) dados.contribuinte_icms = c.contribuinte_icms
      if (c.limite_credito) dados.limite_credito = Number(c.limite_credito)
      if (c.observacoes) dados.observacoes = sanitizeText(c.observacoes)
      if (c.email) dados.email = c.email.trim()
      if (c.telefone) dados.telefone = c.telefone.trim()

      // Monta objeto de endereço se ao menos um campo informado
      const temEndereco = c.endereco_cep || c.endereco_logradouro || c.endereco_cidade
      const enderecoImport = temEndereco ? {
        cep: c.endereco_cep,
        logradouro: c.endereco_logradouro,
        numero: c.endereco_numero,
        complemento: c.endereco_complemento,
        bairro: c.endereco_bairro,
        cidade: c.endereco_cidade,
        estado: c.endereco_estado,
      } : undefined

      clientesPreparados.push({
        linha,
        nome,
        dados,
        tipoPessoa: tipo,
        documento: tipo === 'JURIDICA' ? cnpjRaw : cpfRaw,
        endereco: enderecoImport,
      })

      onProgress?.({
        etapa: 'validacao',
        processados: i + 1,
        total: totalEntrada,
        sucessos: clientesPreparados.length,
        erros: totalErros,
        mensagem: `Validando ${i + 1}/${totalEntrada}...`
      })
    }

    logger.info('Validacao concluida', { aprovados: clientesPreparados.length, rejeitados: totalErros })

    if (clientesPreparados.length === 0) {
      return { sucesso: 0, erros, clientesImportados: [] }
    }

    // ── ETAPA 3: INSERIR/ATUALIZAR cada cliente ──────────────────
    const totalInserir = clientesPreparados.length
    let processados = 0

    for (const cliente of clientesPreparados) {
      onProgress?.({
        etapa: 'insercao',
        processados,
        total: totalInserir,
        sucessos: totalSucessos,
        erros: totalErros,
        mensagem: `Salvando ${processados + 1}/${totalInserir}: ${cliente.nome}`
      })

      const { ok, erro, clienteId } = await upsertCliente(
        cliente.dados,
        empresaId,
        cliente.documento,
        cliente.tipoPessoa
      )

      if (ok) {
        totalSucessos++
        clientesImportados.push(cliente.nome)
        // Insere endereço se fornecido e ID disponível
        if (clienteId && cliente.endereco) {
          await inserirEnderecoImportacao(clienteId, cliente.endereco)
        }
      } else {
        totalErros++
        erros.push({ linha: cliente.linha, cliente: cliente.nome, erro: erro || 'Erro desconhecido' })
        logger.warn('Erro ao importar cliente', { cliente: cliente.nome, erro })
      }

      processados++
    }

    // ── ETAPA 4: FINALIZAÇÃO ─────────────────────────────────────
    onProgress?.({
      etapa: 'finalizacao',
      processados: totalInserir,
      total: totalInserir,
      sucessos: totalSucessos,
      erros: totalErros,
      mensagem: `Concluido: ${totalSucessos} importados, ${totalErros} erros`
    })

    logger.info('Importacao finalizada', { totalSucessos, totalErros })

    return { sucesso: totalSucessos, erros, clientesImportados }

  } catch (error: any) {
    logger.error('Erro critico na importacao', error)
    return {
      sucesso: totalSucessos,
      erros: [...erros, { linha: 0, cliente: 'Geral', erro: error.message || 'Erro crítico na importação' }],
      clientesImportados
    }
  }
}

// ─────────────────────────────────────────────────────────────
// CORREÇÃO EM LOTE – endereços importados sem dados do ViaCEP
// ─────────────────────────────────────────────────────────────

export interface CorrecaoEnderecoResult {
  total: number
  corrigidos: number
  semCEP: number
  erros: number
}

/**
 * Busca todos os clientes_enderecos com logradouro/bairro/cidade = 'Não informado'
 * e reprocessa via ViaCEP para preencher os dados corretos.
 * Chame após uma importação em lote para corrigir registros incompletos.
 */
export async function corrigirEnderecosSemDados(
  onProgress?: (corrigidos: number, total: number) => void
): Promise<CorrecaoEnderecoResult> {
  const result: CorrecaoEnderecoResult = { total: 0, corrigidos: 0, semCEP: 0, erros: 0 }

  // Busca todos os endereços com dados incompletos
  const { data: enderecos, error } = await supabase
    .from('clientes_enderecos')
    .select('id, cep, logradouro, bairro, cidade, estado, codigo_municipio')
    .or('logradouro.eq.Não informado,bairro.eq.Não informado,cidade.eq.Não informado')

  if (error) {
    logger.error('Erro ao buscar endereços incompletos', error)
    return result
  }

  result.total = enderecos?.length ?? 0
  if (!result.total) return result

  for (let i = 0; i < enderecos.length; i++) {
    const end = enderecos[i]
    const cepNorm = normalizarCep(end.cep)

    if (!cepNorm || cepNorm.length !== 8 || cepNorm === '00000000') {
      result.semCEP++
      onProgress?.(i + 1, result.total)
      continue
    }

    try {
      const dados = await consultarCEP(cepNorm)
      if (!dados) {
        result.semCEP++
        onProgress?.(i + 1, result.total)
        continue
      }

      const patch: Record<string, any> = {}
      if (end.logradouro === 'Não informado' && dados.logradouro) patch.logradouro = dados.logradouro
      if (end.bairro === 'Não informado' && dados.bairro) patch.bairro = dados.bairro
      if (end.cidade === 'Não informado' && dados.localidade) patch.cidade = dados.localidade
      if ((!end.estado || end.estado === 'XX') && dados.uf) patch.estado = dados.uf.toUpperCase()
      if (!end.codigo_municipio && dados.ibge) patch.codigo_municipio = dados.ibge

      if (Object.keys(patch).length > 0) {
        const { error: upErr } = await supabase
          .from('clientes_enderecos')
          .update(patch)
          .eq('id', end.id)

        if (upErr) {
          logger.warn('Erro ao corrigir endereço', { id: end.id, erro: upErr.message })
          result.erros++
        } else {
          result.corrigidos++
        }
      }
    } catch (e) {
      logger.warn('Falha ViaCEP na correção em lote', { id: end.id, cep: cepNorm })
      result.erros++
    }

    onProgress?.(i + 1, result.total)

    // Pausa pequena para não sobrecarregar a API ViaCEP (~1 req/150ms)
    await new Promise(r => setTimeout(r, 150))
  }

  logger.info('Correção de endereços concluída', result)
  return result
}
