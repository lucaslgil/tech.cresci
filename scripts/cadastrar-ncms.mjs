// Script para cadastrar NCMs via Supabase API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alylochrlvgcvjdmkmum.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFseWxvY2hybHZnY3ZqZG1rbXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NzY0MTQsImV4cCI6MjA0ODE1MjQxNH0.kMsR5U8u8f_g5L4h4F89zWOIc7Yv2dB2escTica0%2' // Cole aqui sua chave

const supabase = createClient(supabaseUrl, supabaseKey)

async function cadastrarNCM(codigo, descricao) {
  try {
    const { data, error } = await supabase
      .from('ncm')
      .upsert([
        {
          codigo: codigo,
          descricao: descricao,
          ativo: true
        }
      ], {
        onConflict: 'codigo',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error(`❌ Erro ao cadastrar NCM ${codigo}:`, error.message)
      return false
    }

    console.log(`✅ NCM ${codigo} cadastrado com sucesso!`)
    return true
  } catch (err) {
    console.error(`❌ Exceção ao cadastrar NCM ${codigo}:`, err)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando cadastro de NCMs...\n')

  const ncms = [
    { codigo: '12345678', descricao: 'Teste de NCM 1' },
    { codigo: '87654321', descricao: 'Teste de NCM 2' },
    { codigo: '11111111', descricao: 'Teste de NCM 3' },
    { codigo: '99999999', descricao: 'Teste de NCM 4' }
  ]

  for (const ncm of ncms) {
    await cadastrarNCM(ncm.codigo, ncm.descricao)
  }

  console.log('\n✅ Processo concluído!')
  process.exit(0)
}

main()
