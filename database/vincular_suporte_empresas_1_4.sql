-- ============================================
-- VINCULAR USUÁRIO SUPORTE ÀS EMPRESAS 1 e 4
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_vinculos_criados INT := 0;
BEGIN
    -- Buscar o ID do usuário suporte
    SELECT id INTO v_user_id
    FROM usuarios
    WHERE email = 'suporte.ti@crescieperdi.com.br';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário suporte.ti@crescieperdi.com.br não encontrado!';
    END IF;

    RAISE NOTICE 'Usuário encontrado: %', v_user_id;

    -- Remover vínculos antigos
    DELETE FROM users_empresas WHERE user_id = v_user_id;
    RAISE NOTICE 'Vínculos antigos removidos';

    -- Vincular à empresa 1 (FRANCHISING)
    INSERT INTO users_empresas (user_id, empresa_id)
    VALUES (v_user_id, 1)
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
    
    v_vinculos_criados := v_vinculos_criados + 1;
    RAISE NOTICE 'Vinculado à empresa 1 - CRESCI E PERDI FRANCHISING';

    -- Vincular à empresa 4 (SUPRIMENTOS)
    INSERT INTO users_empresas (user_id, empresa_id)
    VALUES (v_user_id, 4)
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
    
    v_vinculos_criados := v_vinculos_criados + 1;
    RAISE NOTICE 'Vinculado à empresa 4 - CRESCI E PERDI SUPRIMENTOS';

    -- Atualizar permissões MASTER
    UPDATE usuarios
    SET 
        cargo = 'MASTER - Suporte Técnico',
        nome = COALESCE(NULLIF(nome, ''), 'Suporte Técnico'),
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

    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuário: suporte.ti@crescieperdi.com.br';
    RAISE NOTICE 'Empresas vinculadas: % (IDs: 1, 4)', v_vinculos_criados;
    RAISE NOTICE 'Cargo: MASTER - Suporte Técnico';
    RAISE NOTICE 'Permissões: TODAS (ADMIN/MASTER)';
    RAISE NOTICE '========================================';
END;
$$;

-- Verificar resultado
SELECT 
    u.email,
    u.nome,
    u.cargo,
    u.ativo,
    STRING_AGG(e.codigo || ' - ' || e.nome_fantasia, ', ' ORDER BY e.id) as empresas
FROM usuarios u
LEFT JOIN users_empresas ue ON u.id = ue.user_id
LEFT JOIN empresas e ON e.id = ue.empresa_id
WHERE u.email = 'suporte.ti@crescieperdi.com.br'
GROUP BY u.id, u.email, u.nome, u.cargo, u.ativo;

-- Verificar funcionamento do RPC get_user_empresas
SELECT * FROM get_user_empresas(
    (SELECT id FROM usuarios WHERE email = 'suporte.ti@crescieperdi.com.br')
);
