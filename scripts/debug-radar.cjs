const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const PAT = 'sbp_78a72769abe2c89f601e697366cd06a982cd6be3';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFseWxvY2hybHZnY3ZqZG1rbXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDcwMjAsImV4cCI6MjA3NTkyMzAyMH0.Jw6iJqy1JthecYfFKNJcftI-5yi_YyGL44f9hNQgqIY';
const supabase = createClient('https://alylochrlvgcvjdmkmum.supabase.co', ANON);

async function main() {
  // 1. Replica EXATAMENTE o que listarClientes faz no browser (anon key = sem RLS user)
  const { data: clientesAnon, error: errAnon } = await supabase
    .from('clientes')
    .select('*, enderecos:clientes_enderecos(count), contatos:clientes_contatos(count)')
    .eq('status', 'ATIVO')
    .order('nome_completo', { ascending: true });

  if (errAnon) { console.log('Erro listarClientes:', errAnon.message); return; }

  const comId = clientesAnon.filter(c => c.solutto_cliente_id != null);
  console.log(`\nTotal ATIVO: ${clientesAnon.length} | Com solutto_cliente_id: ${comId.length}`);
  
  // 2. Pega os primeiros 5 com solutto_cliente_id e testa
  const amostra = comId.slice(0, 5);
  console.log('\nAmostra (primeiros 5 com solutto_cliente_id):');
  amostra.forEach(c => console.log(' Solutto_ID:', c.solutto_cliente_id, '|', c.razao_social || c.nome_fantasia || c.nome_completo));

  console.log('\nTestando Edge Function para cada um:');
  for (const c of amostra) {
    const { data, error } = await supabase.functions.invoke('solutto-radar', {
      body: { cliente_id: c.solutto_cliente_id }
    });
    if (error) {
      console.log(' Solutto_ID', c.solutto_cliente_id, '-> ERRO:', error.message);
    } else {
      console.log(' Solutto_ID', c.solutto_cliente_id, '-> itens:', data.itens.length, (data.itens.length > 0 ? '✓ TEM DADOS' : '(sem compras)'));
    }
    await new Promise(r => setTimeout(r, 600));
  }
}

main().catch(e => console.error('Exception:', e.message));
