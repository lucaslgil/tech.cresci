@echo off
echo ============================================
echo DELETAR BANCO DE DADOS DO PDV
echo ============================================
echo.
echo Este script vai deletar o banco de dados local do PDV
echo para forcar a recriacao com as novas migracoes.
echo.
echo IMPORTANTE: Feche o PDV antes de executar!
echo.
pause

set "APPDATA_PATH=%APPDATA%\flash-pdv"
set "DB_FILE=%APPDATA_PATH%\flash-pdv.db"

if exist "%DB_FILE%" (
    echo.
    echo Deletando: %DB_FILE%
    del "%DB_FILE%"
    echo.
    echo ✅ Banco de dados deletado com sucesso!
    echo.
    echo Agora abra o PDV novamente.
    echo O banco sera recriado com todas as migracoes.
) else (
    echo.
    echo ❌ Arquivo nao encontrado: %DB_FILE%
    echo O banco pode estar em outro local ou ja foi deletado.
)

echo.
pause
