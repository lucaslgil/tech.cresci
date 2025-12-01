import React from 'react'

export const Documentacao: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Documentação do Sistema</h1>
          <p className="mt-2 text-gray-600">
            Sistema de Inventário e Cadastro - Versão 1.0
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Visão Geral */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visão Geral</h2>
            <p className="text-gray-700 mb-4">
              Sistema web moderno desenvolvido em React com TypeScript e Supabase para gerenciamento 
              de inventário e cadastros de empresas e colaboradores.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-2">Tecnologias Utilizadas:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Frontend: React 18 + TypeScript + Vite</li>
                <li>Estilização: TailwindCSS</li>
                <li>Backend: Supabase (Auth + Database)</li>
                <li>Roteamento: React Router DOM</li>
              </ul>
            </div>
          </section>

          {/* Funcionalidades */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">CADASTRO</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Empresa:</strong> Nome, CNPJ, Email, Telefone, Endereço</li>
                  <li>• <strong>Colaborador:</strong> Tipo Pessoa (Física/Jurídica), Nome, CPF/CNPJ, Email, Telefone, Setor, Cargo, Empresa (vinculado)</li>
                  <li>• <strong>Produtos:</strong> ⭐ Cadastro completo com dados fiscais para NF-e/NFC-e/SAT</li>
                  <li>• <strong>Setores e Cargos Personalizáveis:</strong> Adicionar e remover setores e cargos conforme necessidade</li>
                  <li>• Formatação automática: CPF, CNPJ e Telefone</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">INVENTÁRIO</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Cadastro de Itens:</strong> Código, Nome, Modelo, Status, Valor</li>
                  <li>• <strong>Responsabilidade:</strong> Vinculação de itens aos colaboradores responsáveis</li>
                  <li>• <strong>Histórico de Vinculações:</strong> ⭐ Registro completo de todas as vinculações e desvinculações de itens com colaboradores, mantendo histórico permanente mesmo após desvinculação</li>
                  <li>• <strong>Relatório de Equipamentos:</strong> Lista todos os itens com seus responsáveis</li>
                  <li>• <strong>Termo de Responsabilidade:</strong> Geração automática de documento PDF</li>
                  <li>• <strong>Cadastrar Item:</strong> Código, Item, Modelo, Número de Série, Detalhes, Nota Fiscal, Fornecedor, Setor, Status, Valor</li>
                  <li>• <strong>Relatório:</strong> Listagem completa com filtros por setor e status, busca por código/item/fornecedor, exportação CSV</li>
                  <li>• Estatísticas: Total de itens, valor total e valor médio</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Estrutura do Banco de Dados */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estrutura do Banco de Dados</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: empresas</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">nome</td><td>TEXT</td><td>Nome da empresa</td></tr>
                      <tr><td className="py-1">cnpj</td><td>TEXT</td><td>CNPJ da empresa</td></tr>
                      <tr><td className="py-1">email</td><td>TEXT</td><td>Email de contato</td></tr>
                      <tr><td className="py-1">telefone</td><td>TEXT</td><td>Telefone de contato</td></tr>
                      <tr><td className="py-1">endereco</td><td>TEXT</td><td>Endereço completo</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: colaboradores</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">nome</td><td>TEXT</td><td>Nome completo</td></tr>
                      <tr><td className="py-1">email</td><td>TEXT</td><td>Email do colaborador</td></tr>
                      <tr><td className="py-1">telefone</td><td>TEXT</td><td>Telefone do colaborador</td></tr>
                      <tr><td className="py-1">cargo</td><td>TEXT</td><td>Cargo/função</td></tr>
                      <tr><td className="py-1">empresa_id</td><td>UUID</td><td>FK para empresas</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: setores</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>BIGSERIAL</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">nome</td><td>TEXT</td><td>Nome do setor (único)</td></tr>
                      <tr><td className="py-1">ativo</td><td>BOOLEAN</td><td>Status ativo/inativo</td></tr>
                      <tr><td className="py-1">created_at</td><td>TIMESTAMP</td><td>Data de criação</td></tr>
                      <tr><td className="py-1">updated_at</td><td>TIMESTAMP</td><td>Data de atualização</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: cargos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>BIGSERIAL</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">nome</td><td>TEXT</td><td>Nome do cargo (único)</td></tr>
                      <tr><td className="py-1">ativo</td><td>BOOLEAN</td><td>Status ativo/inativo</td></tr>
                      <tr><td className="py-1">created_at</td><td>TIMESTAMP</td><td>Data de criação</td></tr>
                      <tr><td className="py-1">updated_at</td><td>TIMESTAMP</td><td>Data de atualização</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: itens</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">nome</td><td>TEXT</td><td>Nome do item</td></tr>
                      <tr><td className="py-1">descricao</td><td>TEXT</td><td>Descrição detalhada</td></tr>
                      <tr><td className="py-1">categoria</td><td>TEXT</td><td>Categoria do item</td></tr>
                      <tr><td className="py-1">quantidade</td><td>INTEGER</td><td>Quantidade em estoque</td></tr>
                      <tr><td className="py-1">preco</td><td>NUMERIC</td><td>Preço unitário</td></tr>
                      <tr><td className="py-1">codigo</td><td>TEXT</td><td>Código único do item</td></tr>
                      <tr><td className="py-1">responsavel_id</td><td>UUID</td><td>FK para colaboradores - responsável pelo item</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-900 mb-3 flex items-center">
                  <span className="mr-2">⭐</span>
                  Tabela: historico_vinculacao_itens
                  <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">NOVO</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-purple-900">
                    <thead>
                      <tr className="border-b border-purple-200">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">colaborador_id</td><td>UUID</td><td>FK para colaboradores (CASCADE)</td></tr>
                      <tr><td className="py-1">item_id</td><td>UUID</td><td>FK para itens (CASCADE)</td></tr>
                      <tr><td className="py-1">acao</td><td>VARCHAR(20)</td><td>'vinculado' ou 'desvinculado'</td></tr>
                      <tr><td className="py-1">data_acao</td><td>TIMESTAMP</td><td>Data e hora da ação</td></tr>
                      <tr><td className="py-1">usuario_acao</td><td>VARCHAR(255)</td><td>Email do usuário que fez a ação</td></tr>
                      <tr><td className="py-1">observacao</td><td>TEXT</td><td>Observação opcional</td></tr>
                      <tr><td className="py-1">item_codigo</td><td>VARCHAR(50)</td><td>Snapshot: código do item</td></tr>
                      <tr><td className="py-1">item_nome</td><td>TEXT</td><td>Snapshot: nome do item</td></tr>
                      <tr><td className="py-1">item_valor</td><td>DECIMAL(10,2)</td><td>Snapshot: valor do item</td></tr>
                      <tr><td className="py-1">colaborador_nome</td><td>VARCHAR(255)</td><td>Snapshot: nome do colaborador</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-purple-700 bg-purple-100 rounded p-2">
                  📝 <strong>Nota:</strong> Esta tabela mantém histórico imutável de todas as vinculações e desvinculações. 
                  Armazena snapshots dos dados no momento da ação para auditoria completa.
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
                  <span className="mr-2">🏷️</span>
                  Tabela: produtos
                  <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">ERP BRASILEIRO</span>
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  Cadastro completo de produtos compatível com NF-e, NFC-e, CF-e-SAT e SPED Fiscal
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-green-900">
                    <thead>
                      <tr className="border-b border-green-200">
                        <th className="text-left py-2 pr-4">Campo</th>
                        <th className="text-left py-2 pr-4">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">DADOS GERAIS</td></tr>
                      <tr><td className="py-1 pr-4">nome</td><td className="pr-4">TEXT</td><td>Nome do produto (obrigatório)</td></tr>
                      <tr><td className="py-1 pr-4">descricao</td><td className="pr-4">TEXT</td><td>Descrição detalhada</td></tr>
                      <tr><td className="py-1 pr-4">codigo_interno</td><td className="pr-4">TEXT</td><td>Código interno único (obrigatório)</td></tr>
                      <tr><td className="py-1 pr-4">codigo_barras</td><td className="pr-4">TEXT</td><td>Código EAN/GTIN (único)</td></tr>
                      <tr><td className="py-1 pr-4">categoria_id</td><td className="pr-4">UUID</td><td>FK para categorias_produtos</td></tr>
                      <tr><td className="py-1 pr-4">unidade_medida</td><td className="pr-4">TEXT</td><td>UN, CX, KG, etc.</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">DADOS FISCAIS</td></tr>
                      <tr><td className="py-1 pr-4">ncm</td><td className="pr-4">TEXT</td><td>NCM - 8 dígitos (obrigatório)</td></tr>
                      <tr><td className="py-1 pr-4">cest</td><td className="pr-4">TEXT</td><td>CEST - Substituição Tributária</td></tr>
                      <tr><td className="py-1 pr-4">cfop_entrada</td><td className="pr-4">TEXT</td><td>CFOP padrão para entrada</td></tr>
                      <tr><td className="py-1 pr-4">cfop_saida</td><td className="pr-4">TEXT</td><td>CFOP padrão para saída</td></tr>
                      <tr><td className="py-1 pr-4">origem_mercadoria</td><td className="pr-4">INTEGER</td><td>0-8 (Nacional, Estrangeira, etc.)</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">ICMS</td></tr>
                      <tr><td className="py-1 pr-4">cst_icms</td><td className="pr-4">TEXT</td><td>CST para Regime Normal</td></tr>
                      <tr><td className="py-1 pr-4">csosn_icms</td><td className="pr-4">TEXT</td><td>CSOSN para Simples Nacional</td></tr>
                      <tr><td className="py-1 pr-4">aliquota_icms</td><td className="pr-4">DECIMAL(5,2)</td><td>Alíquota de ICMS (%)</td></tr>
                      <tr><td className="py-1 pr-4">reducao_base_icms</td><td className="pr-4">DECIMAL(5,2)</td><td>Redução base ICMS (%)</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">PIS/COFINS</td></tr>
                      <tr><td className="py-1 pr-4">cst_pis</td><td className="pr-4">TEXT</td><td>CST para PIS</td></tr>
                      <tr><td className="py-1 pr-4">aliquota_pis</td><td className="pr-4">DECIMAL(5,2)</td><td>Alíquota de PIS (%)</td></tr>
                      <tr><td className="py-1 pr-4">cst_cofins</td><td className="pr-4">TEXT</td><td>CST para COFINS</td></tr>
                      <tr><td className="py-1 pr-4">aliquota_cofins</td><td className="pr-4">DECIMAL(5,2)</td><td>Alíquota de COFINS (%)</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">IPI</td></tr>
                      <tr><td className="py-1 pr-4">cst_ipi</td><td className="pr-4">TEXT</td><td>CST para IPI</td></tr>
                      <tr><td className="py-1 pr-4">aliquota_ipi</td><td className="pr-4">DECIMAL(5,2)</td><td>Alíquota de IPI (%)</td></tr>
                      <tr><td className="py-1 pr-4">codigo_enquadramento_ipi</td><td className="pr-4">TEXT</td><td>Código de enquadramento (padrão: 999)</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">SUBSTITUIÇÃO TRIBUTÁRIA</td></tr>
                      <tr><td className="py-1 pr-4">tem_substituicao_tributaria</td><td className="pr-4">BOOLEAN</td><td>Produto sujeito a ST</td></tr>
                      <tr><td className="py-1 pr-4">mva_st</td><td className="pr-4">DECIMAL(5,2)</td><td>Margem de Valor Agregado (%)</td></tr>
                      <tr><td className="py-1 pr-4">aliquota_icms_st</td><td className="pr-4">DECIMAL(5,2)</td><td>Alíquota ICMS ST (%)</td></tr>
                      <tr><td className="py-1 pr-4">reducao_base_icms_st</td><td className="pr-4">DECIMAL(5,2)</td><td>Redução base ICMS ST (%)</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">DADOS COMERCIAIS</td></tr>
                      <tr><td className="py-1 pr-4">preco_custo</td><td className="pr-4">DECIMAL(10,2)</td><td>Preço de custo</td></tr>
                      <tr><td className="py-1 pr-4">preco_venda</td><td className="pr-4">DECIMAL(10,2)</td><td>Preço de venda</td></tr>
                      <tr><td className="py-1 pr-4">margem_lucro</td><td className="pr-4">DECIMAL(5,2)</td><td>Margem (calculada automaticamente)</td></tr>
                      <tr><td className="py-1 pr-4">permite_desconto</td><td className="pr-4">BOOLEAN</td><td>Permite desconto na venda</td></tr>
                      <tr><td className="py-1 pr-4">desconto_maximo</td><td className="pr-4">DECIMAL(5,2)</td><td>Desconto máximo permitido (%)</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">ESTOQUE</td></tr>
                      <tr><td className="py-1 pr-4">estoque_atual</td><td className="pr-4">INTEGER</td><td>Quantidade em estoque</td></tr>
                      <tr><td className="py-1 pr-4">estoque_minimo</td><td className="pr-4">INTEGER</td><td>Estoque mínimo (alerta)</td></tr>
                      <tr><td className="py-1 pr-4">estoque_maximo</td><td className="pr-4">INTEGER</td><td>Estoque máximo</td></tr>
                      <tr><td className="py-1 pr-4">localizacao</td><td className="pr-4">TEXT</td><td>Localização física no estoque</td></tr>
                      <tr><td className="py-1 pr-4">controla_lote</td><td className="pr-4">BOOLEAN</td><td>Controlar por lote</td></tr>
                      <tr><td className="py-1 pr-4">controla_serie</td><td className="pr-4">BOOLEAN</td><td>Controlar por número de série</td></tr>
                      <tr><td className="py-1 pr-4">controla_validade</td><td className="pr-4">BOOLEAN</td><td>Controlar data de validade</td></tr>
                      <tr><td className="py-1 pr-4">dias_validade</td><td className="pr-4">INTEGER</td><td>Dias de validade do produto</td></tr>
                      
                      <tr className="bg-green-100"><td colSpan={3} className="py-1 font-bold">CONTROLE</td></tr>
                      <tr><td className="py-1 pr-4">status</td><td className="pr-4">TEXT</td><td>Ativo / Inativo</td></tr>
                      <tr><td className="py-1 pr-4">observacoes</td><td className="pr-4">TEXT</td><td>Observações gerais</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-green-700 bg-green-100 rounded p-2">
                    📋 <strong>Recursos Automáticos:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Cálculo automático da margem de lucro via trigger</li>
                      <li>Registro automático de movimentações de estoque</li>
                      <li>Validação de unicidade para código interno e código de barras</li>
                      <li>Índices otimizados para busca por NCM, código e nome</li>
                    </ul>
                  </div>
                  <div className="text-xs text-green-700 bg-green-100 rounded p-2">
                    🔒 <strong>Segurança:</strong> Row Level Security (RLS) habilitado com políticas de autenticação
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: categorias_produtos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">nome</td><td>TEXT</td><td>Nome da categoria (único)</td></tr>
                      <tr><td className="py-1">descricao</td><td>TEXT</td><td>Descrição da categoria</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: unidades_medida</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">sigla</td><td>TEXT</td><td>Sigla (UN, CX, KG, etc.)</td></tr>
                      <tr><td className="py-1">descricao</td><td>TEXT</td><td>Descrição completa</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tabela: produtos_movimentacoes</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campo</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      <tr><td className="py-1">id</td><td>UUID</td><td>Chave primária</td></tr>
                      <tr><td className="py-1">produto_id</td><td>UUID</td><td>FK para produtos</td></tr>
                      <tr><td className="py-1">tipo_movimentacao</td><td>TEXT</td><td>Entrada/Saída/Ajuste/Transferência/Devolução</td></tr>
                      <tr><td className="py-1">quantidade</td><td>INTEGER</td><td>Quantidade movimentada</td></tr>
                      <tr><td className="py-1">quantidade_anterior</td><td>INTEGER</td><td>Estoque antes da movimentação</td></tr>
                      <tr><td className="py-1">quantidade_atual</td><td>INTEGER</td><td>Estoque após a movimentação</td></tr>
                      <tr><td className="py-1">motivo</td><td>TEXT</td><td>Motivo da movimentação</td></tr>
                      <tr><td className="py-1">documento_fiscal</td><td>TEXT</td><td>Número da NF-e, NFC-e, etc.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Módulo de Produtos - Funcionalidades */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Módulo de Produtos - ERP Brasileiro</h2>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-green-900 mb-3">🏷️ Cadastro de Produtos Completo</h3>
              <p className="text-green-800 mb-4">
                Sistema totalmente preparado para emissão de documentos fiscais brasileiros (NF-e, NFC-e, CF-e-SAT) 
                e integração com SPED Fiscal.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Funcionalidades Principais:</h4>
                  <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                    <li>Cadastro completo com dados gerais, fiscais, comerciais e estoque</li>
                    <li>Navegação por abas para organização dos campos</li>
                    <li>Importação e exportação Excel</li>
                    <li>Busca e filtros por nome, código, NCM, categoria e status</li>
                    <li>Alertas visuais para estoque baixo</li>
                    <li>Cálculo automático de margem de lucro</li>
                    <li>Histórico de movimentações de estoque</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Compatibilidade Fiscal:</h4>
                  <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                    <li>NCM (Nomenclatura Comum do Mercosul)</li>
                    <li>CEST (Código Especificador da ST)</li>
                    <li>CFOP (entrada e saída)</li>
                    <li>Origem da mercadoria (0-8)</li>
                    <li>CST/CSOSN para ICMS</li>
                    <li>CST para PIS/COFINS</li>
                    <li>CST para IPI</li>
                    <li>Substituição Tributária (ST) com MVA</li>
                    <li>Preparado para Simples Nacional e Regime Normal</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-green-300">
                <h4 className="font-medium text-green-900 mb-2">Validações Implementadas:</h4>
                <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                  <li>Nome, código interno e NCM são obrigatórios</li>
                  <li>NCM deve ter exatamente 8 dígitos numéricos</li>
                  <li>Código interno único (não pode duplicar)</li>
                  <li>Código de barras único quando informado</li>
                  <li>Preços e estoque devem ser valores não negativos</li>
                  <li>Indicador visual quando estoque atual &lt; estoque mínimo</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📝 Formato de Importação Excel:</h4>
              <p className="text-sm text-blue-800 mb-2">
                O sistema oferece template Excel para importação em massa de produtos. Campos obrigatórios marcados com *.
              </p>
              <div className="bg-white rounded p-3 text-xs font-mono overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pr-2">Nome *</th>
                      <th className="text-left pr-2">Código Interno *</th>
                      <th className="text-left pr-2">NCM *</th>
                      <th className="text-left pr-2">Unidade</th>
                      <th className="text-left pr-2">Preço Venda</th>
                      <th className="text-left">...</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pr-2">Exemplo Produto</td>
                      <td className="pr-2">PROD001</td>
                      <td className="pr-2">84713012</td>
                      <td className="pr-2">UN</td>
                      <td className="pr-2">150.00</td>
                      <td>...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Componentes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Componentes do Sistema</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Autenticação</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><code>LoginForm</code> - Formulário de login</li>
                  <li><code>ProtectedRoute</code> - Proteção de rotas</li>
                  <li><code>AuthContext</code> - Contexto de autenticação</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Layout</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><code>Layout</code> - Layout principal com navegação</li>
                  <li><code>Documentacao</code> - Esta página de documentação</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Cadastros</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><code>CadastroEmpresa</code> - Formulário de empresa</li>
                  <li><code>CadastroColaborador</code> - Formulário de colaborador com gestão de setores e cargos</li>
                  <li><code>CadastroProdutos</code> - 🏷️ Cadastro completo de produtos com dados fiscais brasileiros</li>
                  <li><code>SelectWithManagement</code> - Componente para selects com adição/remoção de opções</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Inventário</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><code>CadastroItem</code> - Formulário de item</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Gestão de Setores e Cargos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gestão de Setores e Cargos</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-2">Funcionalidade Dinâmica:</h3>
              <p className="text-blue-800">
                Os campos de setor e cargo no cadastro de colaboradores são totalmente personalizáveis e <strong>persistem no banco de dados</strong>. 
                Você pode adicionar novos setores e cargos ou remover os existentes conforme a necessidade da organização.
                Todas as alterações são salvas automaticamente e ficam disponíveis para todos os usuários.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Como Usar</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Clique em <strong>"+ Adicionar"</strong> ao lado do campo para criar novo setor/cargo</li>
                  <li>Clique em <strong>"- Remover"</strong> para excluir setores/cargos existentes</li>
                  <li>As mudanças são aplicadas imediatamente ao formulário</li>
                  <li>Novos itens são automaticamente ordenados alfabeticamente</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Setores Pré-configurados</h3>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                  Administrativo, Controladoria, Compras, Diretoria, Financeiro, 
                  Jurídico, Logística, Marketing, Operacional, Produção, 
                  Qualidade, Recursos Humanos, Tecnologia da Informação, Vendas
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-900 mb-2">Benefícios:</h3>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• <strong>Persistência:</strong> Dados salvos no banco e disponíveis para todos os usuários</li>
                <li>• <strong>Flexibilidade:</strong> Adapte os campos conforme a estrutura da empresa</li>
                <li>• <strong>Organização:</strong> Mantenha apenas setores e cargos relevantes</li>
                <li>• <strong>Padronização:</strong> Evite inconsistências na nomenclatura</li>
                <li>• <strong>Facilidade:</strong> Interface intuitiva para gestão das opções</li>
                <li>• <strong>Segurança:</strong> Soft delete - itens removidos ficam inativos (podem ser restaurados)</li>
              </ul>
            </div>
          </section>

          {/* Responsabilidade de Equipamentos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sistema de Responsabilidade de Equipamentos</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-green-900 mb-2">Funcionalidade Principal:</h3>
              <p className="text-green-800">
                O sistema permite vincular equipamentos/itens a colaboradores responsáveis, 
                gerando relatórios de responsabilidade e termos de responsabilidade em PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Componentes</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><code>RelatorioItens</code> - Relatório de equipamentos e responsáveis</li>
                  <li><code>TermoResponsabilidade</code> - Geração de termo em PDF</li>
                  <li><code>CadastroItem</code> - Cadastro com campo responsável</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Funcionalidades</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Atribuição de responsáveis aos itens</li>
                  <li>Visualização de equipamentos por colaborador</li>
                  <li>Geração automática de termo de responsabilidade</li>
                  <li>Relatório completo com dados do responsável</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Estrutura de Dados:</h3>
              <p className="text-blue-800 text-sm">
                A tabela <code>itens</code> possui o campo <code>responsavel_id</code> que referencia 
                a tabela <code>colaboradores</code>, permitindo rastrear quem é responsável por cada equipamento.
              </p>
            </div>
          </section>

          {/* Configuração */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Configuração do Ambiente</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-yellow-900 mb-2">Variáveis de Ambiente Necessárias:</h3>
              <pre className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
{`VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima`}
              </pre>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Comandos para desenvolvimento:</h3>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  npm install &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Instalar dependências<br/>
                  npm run dev &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Iniciar servidor de desenvolvimento<br/>
                  npm run build &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Build para produção
                </code>
              </div>
            </div>
          </section>

          {/* Regras */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Regras de Desenvolvimento</h2>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 font-medium mb-2">
                IMPORTANTE: Antes de modificar o código, sempre consultar o arquivo <code>regras_do_sistema.txt</code>
              </p>
              <p className="text-red-700 text-sm">
                Este arquivo contém as diretrizes obrigatórias para manutenção e desenvolvimento do sistema.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}