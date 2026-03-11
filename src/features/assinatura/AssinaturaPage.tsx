import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AssinaturaPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [term, setTerm] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!token) return
    // Buscar termo associado ao token (precisa de permissões adequadas)
    const fetchTermByToken = async () => {
      try {
        setLoading(true)
        const { data: tokenRow, error: tokenError } = await supabase
          .from('colaborador_assinatura_tokens')
          .select('token, term_id, expires_at, used_at')
          .eq('token', token)
          .single()

        if (tokenError || !tokenRow) {
          console.error('Token não encontrado', tokenError)
          return
        }

        const { data: termo } = await supabase
          .from('colaborador_termos')
          .select('*')
          .eq('id', tokenRow.term_id)
          .single()

        setTerm(termo || null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTermByToken()
  }, [token])

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file || !token) return alert('Selecione um arquivo para enviar')
    try {
      const SIGN_SERVICE = import.meta.env.VITE_SIGN_SERVICE_URL || 'http://localhost:4000'

      const form = new FormData()
      form.append('file', file)

      // Tenta enviar ao serviço externo
      try {
        const res = await fetch(`${SIGN_SERVICE}/sign/${token}/upload`, {
          method: 'POST',
          body: form
        })

        if (!res.ok) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.error || 'Erro ao enviar arquivo')
        }

        alert('Arquivo enviado e assinatura registrada com sucesso!')
        navigate('/cadastro/colaborador')
        return
      } catch (err) {
        console.warn('Serviço de assinatura offline, usando fallback Supabase:', err)
      }

      // Fallback: fazer upload direto para Storage e chamar RPC confirmar_assinatura_colaborador
      const bucket = import.meta.env.VITE_TERMS_BUCKET || 'termos'
      const filename = `colab_termo_${token}_${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, file, { contentType: 'application/pdf' })
      if (uploadError) {
        console.error('Erro ao subir arquivo no fallback:', uploadError)
        alert('Erro ao enviar arquivo')
        return
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename)
      const publicUrl = publicUrlData.publicUrl

      // Chama RPC para confirmar assinatura
      const { error: rpcError } = await supabase.rpc('confirmar_assinatura_colaborador', { p_token: token, p_signed_url: publicUrl })
      if (rpcError) {
        console.error('Erro ao confirmar assinatura via RPC:', rpcError)
        alert('Erro ao confirmar assinatura')
        return
      }

      alert('Assinatura registrada com sucesso (fallback).')
      navigate('/cadastro/colaborador')
    } catch (err) {
      console.error(err)
      alert('Erro ao enviar arquivo de assinatura')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assinatura do Termo</h1>

      {loading ? (
        <div>Carregando...</div>
      ) : !term ? (
        <div className="text-gray-600">Token inválido ou termo não encontrado.</div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="font-semibold">Termo:</div>
            <div className="text-sm text-gray-700">{term.titulo}</div>
            <div className="text-xs text-gray-500 mt-1">Criado em: {new Date(term.created_at).toLocaleString()}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">PDF Assinado (arquivo)</label>
            <input type="file" accept="application/pdf" onChange={handleFileChange} className="mt-2" />
          </div>

          <div>
            <button onClick={handleUpload} className="px-4 py-2 bg-blue-600 text-white rounded">Enviar e Confirmar Assinatura</button>
          </div>
        </div>
      )}
    </div>
  )
}
