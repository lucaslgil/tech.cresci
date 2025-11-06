import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import { LoginForm } from './features/auth/LoginForm'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { Layout } from './shared/components/Layout'
import { Dashboard } from './features/dashboard/Dashboard'
import { CadastroEmpresa } from './features/empresa/CadastroEmpresa'
import { CadastroColaborador } from './features/colaborador/CadastroColaborador'
import { CadastroItem } from './features/inventario/CadastroItem'
import { RelatorioItens } from './features/inventario/RelatorioItens'
import { LinhasTelefonicas } from './features/inventario/LinhasTelefonicas'
import { Documentacao } from './features/documentacao/Documentacao'
import { Configuracoes } from './features/configuracoes/Configuracoes'
import ConfiguracaoUsuario from './features/perfil/ConfiguracaoUsuario'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
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
            <Route path="cadastro/empresa" element={<CadastroEmpresa />} />
            <Route path="cadastro/colaborador" element={<CadastroColaborador />} />
            <Route path="inventario/cadastrar-item" element={<CadastroItem />} />
            <Route path="inventario/relatorio" element={<RelatorioItens />} />
            <Route path="inventario/linhas-telefonicas" element={<LinhasTelefonicas />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="configuracao" element={<ConfiguracaoUsuario />} />
            <Route path="documentacao" element={<Documentacao />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
