// Shared CORS configuration for Edge Functions
// Restricts requests to known origins only

const ALLOWED_ORIGINS = [
  'https://tech-cresci.vercel.app',
  'https://tech.crescieperdi.com.br',
  'http://localhost:5173',
  'http://localhost:5174',
]

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, PATCH, OPTIONS, PUT, DELETE',
    'Vary': 'Origin',
  }
}

// For functions called only from server-side (cron jobs, internal) — never from browser
export const corsInternal: Record<string, string> = {
  'Access-Control-Allow-Origin': 'null',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
