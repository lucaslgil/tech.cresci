-- ============================================
-- VINCULAR USUÁRIO SUPORTE A TODAS AS EMPRESAS
-- E DAR PERMISSÕES COMPLETAS (MASTER)
-- ============================================

-- 1. Buscar o ID do usuário suporte.ti@crescieperdi.com.br
DO $$
DECLARE
    v_user_id UUID;
    v_empresa_record RECORD;
    v_empresas_vinculadas INT;
BEGIN
    -- Buscar o user_id
    SELECT id INTO v_user_id
    FROM usuarios
    WHERE email = 'suporte.ti@crescieperdi.com.br';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário suporte.ti@crescieperdi.com.br não encontrado!';
    END IF;

    RAISE NOTICE 'Usuário encontrado: %', v_user_id;

    -- Verificar quantas empresas já estão vinculadas
    SELECT COUNT(*) INTO v_empresas_vinculadas
    FROM users_empresas
    WHERE user_id = v_user_id;

    RAISE NOTICE 'Empresas já vinculadas: %', v_empresas_vinculadas;

    -- Remover todos os vínculos antigos
    DELETE FROM users_empresas WHERE user_id = v_user_id;
    RAISE NOTICE 'Vínculos antigos removidos';

    -- Vincular a TODAS as empresas existentes
    FOR v_empresa_record IN 
        SELECT id, razao_social FROM empresas ORDER BY id
    LOOP
        INSERT INTO users_empresas (user_id, empresa_id)
        VALUES (v_user_id, v_empresa_record.id)
        ON CONFLICT (user_id, empresa_id) DO NOTHING;
        
        RAISE NOTICE 'Vinculado à empresa ID % - %', v_empresa_record.id, v_empresa_record.razao_social;
    END LOOP;

    -- Atualizar o usuário com permissões MASTER completas
    UPDATE usuarios
    SET 
        cargo = 'MASTER - Suporte Técnico',
        permissoes = jsonb_build_object(
            'cadastro_empresa', true,
            'cadastro_colaborador', true,
            'cadastro_produtos', true,
            'cadastro_clientes', true,
            'inventario_itens', true,
            'inventario_relatorio', true,
            'inventario_linhas', true,
            'vendas_listagem', true,
            'vendas_nova', true,
            'vendas_relatorios', true,
            'vendas_parametros', true,
            'notas_fiscais_consultar', true,
            'notas_fiscais_emitir', true,
            'notas_fiscais_cancelar', true,
            'configuracoes', true,
            'usuarios_gerenciar', true,
            'sistema_admin', true
        ),
        ativo = true
    WHERE id = v_user_id;

    RAISE NOTICE 'Permissões MASTER aplicadas';

    -- Exibir resultado final
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESULTADO FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuário: suporte.ti@crescieperdi.com.br';
    RAISE NOTICE 'Cargo: MASTER - Suporte Técnico';
    RAISE NOTICE 'Total de empresas vinculadas: %', (SELECT COUNT(*) FROM users_empresas WHERE user_id = v_user_id);
    RAISE NOTICE 'Permissões: TODAS (MASTER)';
    RAISE NOTICE '========================================';
END;
$$;

-- 2. Verificar o resultado
SELECT 
    u.email,
    u.nome,
    u.cargo,
    u.ativo,
    COUNT(ue.empresa_id) as total_empresas
FROM usuarios u
LEFT JOIN users_empresas ue ON u.id = ue.user_id
WHERE u.email = 'suporte.ti@crescieperdi.com.br'
GROUP BY u.id, u.email, u.nome, u.cargo, u.ativo;

-- 3. Listar todas as empresas vinculadas
SELECT 
    e.id,
    e.razao_social,
    e.nome_fantasia,
    e.cnpj,
    'VINCULADO' as status
FROM users_empresas ue
JOIN empresas e ON e.id = ue.empresa_id
JOIN usuarios u ON u.id = ue.user_id
WHERE u.email = 'suporte.ti@crescieperdi.com.br'
ORDER BY e.id;
