import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { supabaseAdmin } from './supabaseClient';

dotenv.config();

const app = express();
app.use(express.json());
// Enable CORS for local development and configured frontends
app.use(cors());
const upload = multer();

const PORT = Number(process.env.PORT || 4000);
const TERMS_BUCKET = process.env.TERMS_BUCKET || 'termos';
const SIGN_PAGE_BASE_URL = process.env.SIGN_PAGE_BASE_URL || 'https://seu-site.com/assinatura';

// Create term (backend should validate permissions)
app.post('/terms', async (req, res) => {
  const { colaborador_id, item_id, titulo, conteudo, valor } = req.body;
  if (!colaborador_id) return res.status(400).json({ error: 'colaborador_id is required' });

  const { data, error } = await supabaseAdmin
    .from('colaborador_termos')
    .insert([{ colaborador_id, item_id: item_id || null, titulo: titulo || null, conteudo: conteudo || null, valor: valor || 0 }])
    .select('id')
    .single();

  if (error) return res.status(500).json({ error });
  return res.json({ id: data.id });
});

// Register company signature (uses SQL function)
app.post('/terms/:id/company-sign', async (req, res) => {
  const termId = req.params.id;
  const { empresa_signed_url } = req.body;
  if (!empresa_signed_url) return res.status(400).json({ error: 'empresa_signed_url required' });

  const { error } = await supabaseAdmin.rpc('registrar_assinatura_empresa', { p_term_id: termId, p_empresa_signed_url: empresa_signed_url });
  if (error) return res.status(500).json({ error });
  return res.json({ success: true });
});

// Generate token for collaborator signature
app.post('/terms/:id/generate-token', async (req, res) => {
  const termId = req.params.id;
  const validDays = Number(req.body.valid_days || 7);
  const { data, error } = await supabaseAdmin.rpc('gerar_token_assinatura', { p_term_id: termId, p_valid_days: validDays });
  if (error) return res.status(500).json({ error });
  // rpc returns scalar token; supabase-js wraps it in data
  const token = data;
  const link = `${SIGN_PAGE_BASE_URL}/${token}`;
  return res.json({ token, link });
});

// Upload signed PDF for a given token (multipart form: field 'file')
app.post('/sign/:token/upload', upload.single('file'), async (req, res) => {
  const token = req.params.token;
  if (!req.file) return res.status(400).json({ error: 'file is required' });

  try {
    const filename = `termo_${token}_${Date.now()}.pdf`;
    const fileBuffer = req.file.buffer;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(TERMS_BUCKET)
      .upload(filename, fileBuffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) return res.status(500).json({ error: uploadError });

    // Get public URL (you can also create a signed url)
    const { data: publicUrlData } = supabaseAdmin.storage.from(TERMS_BUCKET).getPublicUrl(filename);
    const publicUrl = publicUrlData.publicUrl;

    // Call DB function to confirm signature
    const { data, error } = await supabaseAdmin.rpc('confirmar_assinatura_colaborador', { p_token: token, p_signed_url: publicUrl });
    if (error) return res.status(500).json({ error });

    return res.json({ success: true, message: data });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Assinaturas service running on port ${PORT}`);
});
