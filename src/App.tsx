import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import { TabsProvider } from './shared/context/TabsContext'
import { LoginForm } from './features/auth/LoginForm'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { PermissionGuard } from './features/auth/PermissionGuard'
import { Layout } from './shared/components/Layout'
import { Dashboard } from './features/dashboard/Dashboard'
import { CadastroEmpresa } from './features/empresa/CadastroEmpresa'
import { CadastroColaborador } from './features/colaborador/CadastroColaborador'
import { CadastroProdutos } from './features/produtos/CadastroProdutos'
import { CadastroItem } from './features/inventario/CadastroItem'
import { RelatorioItens } from './features/inventario/RelatorioItens'
import { LinhasTelefonicas } from './features/inventario/LinhasTelefonicas'
import { GerenciamentoTarefas } from './features/tarefas/GerenciamentoTarefas'
import { NovaSolicitacao } from './features/tarefas/NovaSolicitacao'
import { Documentacao } from './features/documentacao/Documentacao'
import { Configuracoes } from './features/configuracoes/Configuracoes'
import ConfiguracaoUsuario from './features/perfil/ConfiguracaoUsuario'
import { CadastroClientes, ListagemClientes } from './features/clientes'
import { EmitirNotaFiscal, ParametrosFiscais } from './features/notas-fiscais'
import { NovaVenda, ListagemVendas, RelatoriosVendas } from './features/vendas'
import Franquias from './features/franquias/Franquias'
import { ContasPagar } from './features/financeiro/ContasPagar'
import { ContasReceber } from './features/financeiro/ContasReceber'
import { ParametrosFinanceiros } from './features/financeiro/ParametrosFinanceiros'
import { useTema } from './shared/hooks/useTema'

function App() {
  // Aplicar tema ao iniciar
  useTema()
  
  return (
    <AuthProvider>
      <Router>
        <TabsProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            
            {/* Rota Pública - Nova Solicitação */}
            <Route path="/nova-solicitacao" element={<NovaSolicitacao />} />
            
            <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* CADASTROS */}
            <Route path="cadastro/empresa" element={
              <PermissionGuard requiredPermissions={['cadastro_empresa']}>
                <CadastroEmpresa />
              </PermissionGuard>
            } />
            <Route path="cadastro/colaborador" element={
              <PermissionGuard requiredPermissions={['cadastro_colaborador']}>
                <CadastroColaborador />
              </PermissionGuard>
            } />
            <Route path="cadastro/produtos" element={
              <PermissionGuard requiredPermissions={['cadastro_produtos']}>
                <CadastroProdutos />
              </PermissionGuard>
            } />
            <Route path="cadastro/clientes" element={
              <PermissionGuard requiredPermissions={['cadastro_clientes']}>
                <ListagemClientes />
              </PermissionGuard>
            } />
            <Route path="cadastro/clientes/novo" element={
              <PermissionGuard requiredPermissions={['cadastro_clientes']}>
                <CadastroClientes />
              </PermissionGuard>
            } />
            <Route path="cadastro/clientes/:id" element={
              <PermissionGuard requiredPermissions={['cadastro_clientes']}>
                <CadastroClientes />
              </PermissionGuard>
            } />
            
            {/* INVENTÁRIO */}
            <Route path="inventario/cadastro" element={
              <PermissionGuard requiredPermissions={['inventario_itens']}>
                <CadastroItem />
              </PermissionGuard>
            } />
            <Route path="inventario/cadastrar-item" element={
              <PermissionGuard requiredPermissions={['inventario_itens']}>
                <CadastroItem />
              </PermissionGuard>
            } />
            <Route path="inventario/relatorio" element={
              <PermissionGuard requiredPermissions={['inventario_relatorio']}>
                <RelatorioItens />
              </PermissionGuard>
            } />
            <Route path="inventario/linhas-telefonicas" element={
              <PermissionGuard requiredPermissions={['inventario_linhas']}>
                <LinhasTelefonicas />
              </PermissionGuard>
            } />
            
            {/* NOTAS FISCAIS */}
            <Route path="notas-fiscais/emitir" element={
              <PermissionGuard requiredPermissions={['notas_fiscais_emitir']}>
                <EmitirNotaFiscal />
              </PermissionGuard>
            } />
            <Route path="notas-fiscais/parametros" element={
              <PermissionGuard requiredPermissions={['notas_fiscais_parametros']}>
                <ParametrosFiscais />
              </PermissionGuard>
            } />
            
            {/* VENDAS */}
            <Route path="vendas" element={
              <PermissionGuard requiredPermissions={['vendas_listagem', 'vendas_nova']}>
                <ListagemVendas />
              </PermissionGuard>
            } />
            <Route path="vendas/nova" element={
              <PermissionGuard requiredPermissions={['vendas_nova']}>
                <NovaVenda />
              </PermissionGuard>
            } />
            <Route path="vendas/:id" element={
              <PermissionGuard requiredPermissions={['vendas_nova', 'vendas_listagem']}>
                <NovaVenda />
              </PermissionGuard>
            } />
            <Route path="vendas/relatorios" element={
              <PermissionGuard requiredPermissions={['vendas_relatorios']}>
                <RelatoriosVendas />
              </PermissionGuard>
            } />
            
            {/* FRANQUIAS */}
            <Route path="franquias" element={
              <PermissionGuard requiredPermissions={['franquias']}>
                <Franquias />
              </PermissionGuard>
            } />
            
            {/* FINANCEIRO */}
            <Route path="financeiro/contas-pagar" element={
              <PermissionGuard requiredPermissions={['financeiro_contas_pagar']}>
                <ContasPagar />
              </PermissionGuard>
            } />
            <Route path="financeiro/contas-receber" element={
              <PermissionGuard requiredPermissions={['financeiro_contas_receber']}>
                <ContasReceber />
              </PermissionGuard>
            } />
            <Route path="financeiro/parametros" element={
              <PermissionGuard requiredPermissions={['financeiro_parametros']}>
                <ParametrosFinanceiros />
              </PermissionGuard>
            } />
            
            {/* TAREFAS */}
            <Route path="tarefas" element={
              <PermissionGuard requiredPermissions={['tarefas']}>
                <GerenciamentoTarefas />
              </PermissionGuard>
            } />
            <Route path="tarefas/nova-solicitacao" element={
              <PermissionGuard requiredPermissions={['tarefas']}>
                <NovaSolicitacao />
              </PermissionGuard>
            } />
            
            {/* CONFIGURAÇÕES */}
            <Route path="configuracoes" element={
              <PermissionGuard requiredPermissions={['configuracoes']}>
                <Configuracoes />
              </PermissionGuard>
            } />
            
            {/* PERFIL - Sempre acessível */}
            <Route path="configuracao" element={<ConfiguracaoUsuario />} />
            
            {/* DOCUMENTAÇÃO */}
            <Route path="documentacao" element={
              <PermissionGuard requiredPermissions={['documentacao']}>
                <Documentacao />
              </PermissionGuard>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </TabsProvider>
      </Router>
    </AuthProvider>
  )
}

export default App
