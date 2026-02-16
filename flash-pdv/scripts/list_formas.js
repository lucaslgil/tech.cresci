import initSqlJs from 'sql.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  try {
    const wasmPath = join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    const wasmBinary = readFileSync(wasmPath)
    const SQL = await initSqlJs({ wasmBinary })

    const dbPath = join(process.env.APPDATA || '', 'flash-pdv', 'flash-pdv.db')
    console.log('DB PATH:', dbPath)

    const buffer = readFileSync(dbPath)
    const db = new SQL.Database(buffer)

    const res = db.exec("SELECT id, empresa_id, codigo, nome, ativo, updated_at FROM formas_pagamento ORDER BY nome")
    if (!res || res.length === 0) {
      console.log('NO_ROWS_LOCAL')

      // Tentar ler configuração para consultar Supabase diretamente
      const cfg = db.exec("SELECT value FROM config WHERE key = 'pdv_config'")
      if (!cfg || !cfg[0] || !cfg[0].values || cfg[0].values.length === 0) {
        console.error('NO_CONFIG: config pdv_config not found in local DB')
        return
      }

      const cfgJson = JSON.parse(cfg[0].values[0][0])
      const supabaseUrl = cfgJson.supabaseUrl
      const supabaseKey = cfgJson.supabaseKey
      const empresaId = cfgJson.empresaId

      if (!supabaseUrl || !supabaseKey) {
        console.error('NO_SUPABASE_CONFIG')
        return
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      const candidateTables = [
        'formas_pagamento',
        'formas_pagamentos',
        'formas_de_pagamento',
        'financeiro_formas_pagamento',
        'parametros_formas_pagamento',
        'payment_methods'
      ]

      for (const tbl of candidateTables) {
        try {
          console.log(`TRY_SUPABASE_TABLE: ${tbl}`)
          const { data, error } = await supabase.from(tbl).select('*').eq('empresa_id', empresaId).limit(5)
          if (error) {
            console.log(`SUPABASE_ERROR for ${tbl}:`, error.message)
            continue
          }
          console.log(`SUPABASE_OK ${tbl}: rows=${data ? data.length : 0}`)
          if (data && data.length > 0) {
            console.log('SAMPLE:', JSON.stringify(data.slice(0,5), null, 2))
            return
          }
        } catch (err) {
          console.log(`EXCEPTION querying ${tbl}:`, err.message || err)
        }
      }

      console.log('NO_TABLE_FOUND_ON_SUPABASE')
      return
    }

    const cols = res[0].columns
    const values = res[0].values

    const rows = values.map(row => {
      const obj = {}
      row.forEach((v, i) => { obj[cols[i]] = v })
      return obj
    })

    console.log(JSON.stringify(rows, null, 2))
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err)
    process.exit(2)
  }
}

main()
