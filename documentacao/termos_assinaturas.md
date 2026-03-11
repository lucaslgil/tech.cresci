**Termos e Assinaturas**

- **Propósito:** Documenta o fluxo para geração de termos de responsabilidade, assinatura da empresa e assinatura do colaborador via link.

- **Arquivos criados:**
  - `database/criar_tabela_termos_assinaturas_colaborador.sql` : migration SQL com tabelas, triggers e funções (gerar_token_assinatura, confirmar_assinatura_colaborador, registrar_assinatura_empresa).
  - `services/assinaturas` : serviço Node/TypeScript com endpoints para gerar token, registrar assinatura da empresa e processar upload do PDF assinado.

- **Requisitos (Supabase):**
  - Criar bucket de Storage com nome `termos` (ou ajustar `TERMS_BUCKET`).
  - Rodar o SQL em `database/criar_tabela_termos_assinaturas_colaborador.sql` no SQL Editor do Supabase.
  - (Opcional) Habilitar Row Level Security e criar policies conforme seu modelo de auth.

- **Variáveis de ambiente (service):**
  - `SUPABASE_URL` - URL do projeto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` - Service Role key (usar apenas no backend confiável)
  - `TERMS_BUCKET` - nome do bucket de storage (default: termos)
  - `SIGN_PAGE_BASE_URL` - base URL da página de assinatura (ex: https://seu-site.com/assinatura)

- **Endpoints (service)**
  - `POST /terms` → criar termo
    - body: `{ colaborador_id, item_id?, titulo?, conteudo?, valor? }`
    - retorna: `{ id }`

  - `POST /terms/:id/company-sign` → registrar assinatura da empresa
    - body: `{ empresa_signed_url }`
    - chama `registrar_assinatura_empresa` no banco

  - `POST /terms/:id/generate-token` → gerar token de assinatura
    - body: `{ valid_days? }`
    - retorna: `{ token, link }` onde `link` = `SIGN_PAGE_BASE_URL/<token>`

  - `POST /sign/:token/upload` → endpoint que recebe o PDF assinado (multipart form, field `file`)
    - Faz upload para Storage e chama `confirmar_assinatura_colaborador(token, public_url)` no banco

- **Fluxo recomendado**
  1. Backend cria o termo (`POST /terms`) e grava `colaborador_termos`.
  2. Backend registra assinatura da empresa (`POST /terms/:id/company-sign`) usando a URL do PDF já assinado pela empresa (pode ser gerado usando um processo com certificado digital offline).
  3. Backend gera token (`POST /terms/:id/generate-token`) e envia o link para o colaborador (email/WhatsApp).
  4. Colaborador abre link de assinatura; após assinatura, o front envia o PDF final para `POST /sign/:token/upload`.
  5. Serviço grava o arquivo em Storage e chama `confirmar_assinatura_colaborador` para atualizar status e anexar URL no registro.

- **Observações de segurança e conformidade**
  - Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
  - Proteja o endpoint `/sign/:token/upload` — idealmente a página de assinatura valida o token antes de permitir upload.
  - Considere gerar URLs assinadas de curto prazo em vez de publicUrl se precisar de mais segurança.

- **Integração com frontend existente**
  - Quando gerar token, envie link para rota frontend: `/assinatura/:token`. Nessa rota, crie uma interface para o colaborador assinar (assinatura por desenho ou upload de PDF). Ao finalizar, envie o arquivo para `POST /sign/:token/upload`.

-- Fim
