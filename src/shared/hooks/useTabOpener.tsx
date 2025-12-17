/**
 * HOOK: USE TAB OPENER
 * Helper para abrir abas facilmente com ícones
 */

import { 
  Building2, Users, Package, ShoppingCart, FileText, 
  Settings, BookOpen, CheckSquare, Phone, DollarSign,
  TrendingUp, Store
} from 'lucide-react'
import { useTabs } from '../context/TabsContext'

export const useTabOpener = () => {
  const { openTab } = useTabs()

  const tabs = {
    // CADASTROS
    cadastroEmpresa: () => openTab({
      title: 'Cadastro de Empresa',
      path: '/cadastro/empresa',
      icon: <Building2 className="w-3.5 h-3.5" />
    }),
    
    cadastroColaborador: () => openTab({
      title: 'Cadastro de Colaboradores',
      path: '/cadastro/colaborador',
      icon: <Users className="w-3.5 h-3.5" />
    }),
    
    cadastroProdutos: () => openTab({
      title: 'Cadastro de Produtos',
      path: '/cadastro/produtos',
      icon: <Package className="w-3.5 h-3.5" />
    }),
    
    cadastroClientes: () => openTab({
      title: 'Cadastro de Clientes',
      path: '/cadastro/clientes',
      icon: <Users className="w-3.5 h-3.5" />
    }),

    listagemClientes: () => openTab({
      title: 'Listagem de Clientes',
      path: '/cadastro/clientes',
      icon: <Users className="w-3.5 h-3.5" />
    }),

    // INVENTÁRIO
    cadastroItem: () => openTab({
      title: 'Cadastrar Item',
      path: '/inventario/cadastro',
      icon: <Package className="w-3.5 h-3.5" />
    }),
    
    relatorioItens: () => openTab({
      title: 'Relatório de Itens',
      path: '/inventario/relatorio',
      icon: <FileText className="w-3.5 h-3.5" />
    }),
    
    linhasTelefonicas: () => openTab({
      title: 'Linhas Telefônicas',
      path: '/inventario/linhas-telefonicas',
      icon: <Phone className="w-3.5 h-3.5" />
    }),

    // VENDAS
    novaVenda: () => openTab({
      title: 'Nova Venda',
      path: '/vendas/nova',
      icon: <ShoppingCart className="w-3.5 h-3.5" />
    }),
    
    listagemVendas: () => openTab({
      title: 'Listagem de Vendas',
      path: '/vendas',
      icon: <ShoppingCart className="w-3.5 h-3.5" />
    }),
    
    relatoriosVendas: () => openTab({
      title: 'Relatórios de Vendas',
      path: '/vendas/relatorios',
      icon: <TrendingUp className="w-3.5 h-3.5" />
    }),

    parametrosVendas: () => openTab({
      title: 'Parâmetros de Vendas',
      path: '/vendas/parametros',
      icon: <Settings className="w-3.5 h-3.5" />
    }),

    // NOTAS FISCAIS
    emitirNotaFiscal: () => openTab({
      title: 'Emitir Nota Fiscal',
      path: '/notas-fiscais/emitir',
      icon: <FileText className="w-3.5 h-3.5" />
    }),
    
    parametrosFiscais: () => openTab({
      title: 'Parâmetros Fiscais',
      path: '/notas-fiscais/parametros',
      icon: <Settings className="w-3.5 h-3.5" />
    }),

    // FRANQUIAS
    franquias: () => openTab({
      title: 'Franquias',
      path: '/franquias',
      icon: <Store className="w-3.5 h-3.5" />
    }),

    // FINANCEIRO
    contasPagar: () => openTab({
      title: 'Contas a Pagar',
      path: '/financeiro/contas-pagar',
      icon: <DollarSign className="w-3.5 h-3.5" />
    }),
    
    contasReceber: () => openTab({
      title: 'Contas a Receber',
      path: '/financeiro/contas-receber',
      icon: <DollarSign className="w-3.5 h-3.5" />
    }),
    
    parametrosFinanceiros: () => openTab({
      title: 'Parâmetros Financeiros',
      path: '/financeiro/parametros',
      icon: <Settings className="w-3.5 h-3.5" />
    }),

    // OUTROS
    tarefas: () => openTab({
      title: 'Tarefas',
      path: '/tarefas',
      icon: <CheckSquare className="w-3.5 h-3.5" />
    }),
    
    configuracoes: () => openTab({
      title: 'Configurações',
      path: '/configuracoes',
      icon: <Settings className="w-3.5 h-3.5" />
    }),
    
    documentacao: () => openTab({
      title: 'Documentação',
      path: '/documentacao',
      icon: <BookOpen className="w-3.5 h-3.5" />
    })
  }

  return tabs
}
