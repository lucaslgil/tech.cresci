# =====================================================================
# GERADOR DE SQL - Vinculação de Franqueados
# =====================================================================
# Como usar:
#   1. Salve sua planilha como CSV (Excel > Salvar Como > CSV UTF-8)
#   2. Abra o PowerShell nesta pasta
#   3. Execute: .\gerar_sql_franqueados.ps1 -CsvPath "C:\caminho\para\arquivo.csv"
#   4. Será gerado o arquivo SQL pronto para colar no Supabase
# =====================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$CsvPath
)

if (-not (Test-Path $CsvPath)) {
    Write-Error "Arquivo não encontrado: $CsvPath"
    exit 1
}

# Lê o CSV (sem cabeçalho, pois a planilha começa direto nos dados)
$rows = Import-Csv -Path $CsvPath -Header "nome_cliente","nome_franqueado" -Encoding UTF8

$outputPath = [System.IO.Path]::ChangeExtension($CsvPath, "sql")

$linhasValues = @()
$ignoradas = 0

foreach ($row in $rows) {
    $cliente = $row.nome_cliente.Trim()
    $franqueado = $row.nome_franqueado.Trim()

    # Pula linhas vazias
    if ([string]::IsNullOrWhiteSpace($cliente) -or [string]::IsNullOrWhiteSpace($franqueado)) {
        $ignoradas++
        continue
    }

    # Escapa aspas simples para SQL
    $clienteEscapado   = $cliente.Replace("'", "''")
    $franqueadoEscapado = $franqueado.Replace("'", "''")

    $linhasValues += "    ('$clienteEscapado', '$franqueadoEscapado')"
}

$totalLinhas = $linhasValues.Count
$valuesBloco = $linhasValues -join ",`n"

$sql = @"
-- =====================================================================
-- VINCULAR NOME_FRANQUEADO NAS UNIDADES
-- Gerado automaticamente em $(Get-Date -Format 'dd/MM/yyyy HH:mm')
-- Total de registros: $totalLinhas
-- =====================================================================

-- ─── PREVIEW: confira antes de executar o UPDATE ─────────────────────

WITH mapeamento (nome_cliente, nome_franqueado) AS (
  VALUES
$valuesBloco
)
SELECT
    u.id            AS unidade_id,
    u.codigo_unidade,
    u.nome_unidade,
    COALESCE(c.razao_social, c.nome_fantasia)   AS cliente_encontrado,
    m.nome_franqueado                           AS franqueado_novo,
    u.nome_franqueado                           AS franqueado_atual
FROM mapeamento m
JOIN clientes c ON (
    lower(trim(COALESCE(c.razao_social,'')))    = lower(trim(m.nome_cliente))
    OR lower(trim(COALESCE(c.nome_fantasia,''))) = lower(trim(m.nome_cliente))
)
JOIN franquia_unidades u ON u.cliente_id = c.id
ORDER BY u.nome_unidade;


-- ─── UPDATE EM MASSA ─────────────────────────────────────────────────

WITH mapeamento (nome_cliente, nome_franqueado) AS (
  VALUES
$valuesBloco
)
UPDATE franquia_unidades u
SET
    nome_franqueado = m.nome_franqueado,
    updated_at      = NOW()
FROM mapeamento m
JOIN clientes c ON (
    lower(trim(COALESCE(c.razao_social,'')))    = lower(trim(m.nome_cliente))
    OR lower(trim(COALESCE(c.nome_fantasia,''))) = lower(trim(m.nome_cliente))
)
WHERE u.cliente_id = c.id;


-- ─── VERIFICAÇÃO FINAL ───────────────────────────────────────────────

SELECT
    COUNT(*) FILTER (WHERE nome_franqueado IS NOT NULL AND nome_franqueado <> '') AS com_franqueado,
    COUNT(*) FILTER (WHERE nome_franqueado IS NULL OR nome_franqueado = '')        AS sem_franqueado,
    COUNT(*)                                                                       AS total
FROM franquia_unidades;
"@

$sql | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host ""
Write-Host "✅ SQL gerado com sucesso!" -ForegroundColor Green
Write-Host "   Arquivo: $outputPath" -ForegroundColor Cyan
Write-Host "   Registros processados: $totalLinhas" -ForegroundColor Cyan
if ($ignoradas -gt 0) {
    Write-Host "   Linhas vazias ignoradas: $ignoradas" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "  1. Abra o arquivo SQL gerado" -ForegroundColor Gray
Write-Host "  2. Execute o PREVIEW no Supabase SQL Editor" -ForegroundColor Gray
Write-Host "  3. Confirme os dados e execute o UPDATE" -ForegroundColor Gray
