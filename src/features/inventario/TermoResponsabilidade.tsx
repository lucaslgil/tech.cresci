import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Item {
  id: string
  codigo: string
  item: string
  modelo?: string
  categoria?: string
  numero_serie?: string
  detalhes?: string
  nota_fiscal?: string
  fornecedor?: string
  setor: string
  status: string
  valor: number
  created_at: string
}

interface Colaborador {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  setor: string
  cargo: string
  empresa_id: string
  created_at: string
}

interface TermoResponsabilidadeProps {
  item: Item
  isOpen: boolean
  onClose: () => void
}

export default function TermoResponsabilidade({ item, isOpen, onClose }: TermoResponsabilidadeProps) {
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF')
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingColaboradores, setLoadingColaboradores] = useState(false)

  // Buscar colaboradores
  const fetchColaboradores = async () => {
    try {
      setLoadingColaboradores(true)
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome')

      if (error) throw error
      setColaboradores(data || [])
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
      // Dados mock para demo
      setColaboradores([
        {
          id: '1',
          nome: 'ADRIANO CESAR MISSURA',
          cpf: '149.910.528-23',
          email: 'adriano@exemplo.com',
          telefone: '(11) 99999-9999',
          setor: 'Gerência',
          cargo: 'GERENTE CONTABILIDADE',
          empresa_id: '1',
          created_at: '2024-01-01'
        },
        {
          id: '2',
          nome: 'JEFFERSON CANTALEJO',
          cpf: '123.456.789-00',
          email: 'jefferson@exemplo.com',
          telefone: '(11) 88888-8888',
          setor: 'Administrativo',
          cargo: 'Analista',
          empresa_id: '1',
          created_at: '2024-01-01'
        }
      ])
    } finally {
      setLoadingColaboradores(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchColaboradores()
    }
  }, [isOpen])

  // Filtrar colaboradores
  const colaboradoresFiltrados = colaboradores.filter(colaborador =>
    colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.cpf.includes(searchTerm) ||
    colaborador.setor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Gerar termo de responsabilidade
  const gerarTermo = () => {
    if (!colaboradorSelecionado) return

    const empresaInfo = {
      nome: 'CRESCI E PERDI FRANCHISING LTDA',
      cnpj: '27.767.670/0001-94'
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR')
    const localData = 'São José do Rio Pardo - SP'

    // Criar um novo elemento para impressão
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Termo de Responsabilidade</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 0;
              max-width: 21cm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 25px;
              text-decoration: underline;
            }
            .content {
              text-align: justify;
              margin-bottom: 15px;
            }
            .equipment-info {
              margin: 20px 0;
              margin-left: 20px;
            }
            .equipment-info li {
              margin-bottom: 5px;
            }
            .clause {
              margin-bottom: 15px;
              text-align: justify;
            }
            .signatures {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signature-left, .signature-right {
              text-align: center;
              width: 45%;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              margin-bottom: 5px;
              padding-bottom: 2px;
              height: 40px;
            }
            .location-date {
              text-align: center;
              margin-top: 30px;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body { 
                margin: 0; 
                font-size: 11px;
              }
              .no-print { 
                display: none; 
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            TERMO DE RESPONSABILIDADE DE UTILIZAÇÃO DE EQUIPAMENTOS
          </div>
          
          <div class="content">
            A <span class="bold">EMPREGADORA</span> <span class="bold">${empresaInfo.nome}</span>, inscrita no CNPJ sob o nº <span class="bold">${empresaInfo.cnpj}</span>, 
            entrega neste ato, o aparelho celular, descrito, abaixo, juntamente com chip corporativo:
          </div>
          
          <div class="equipment-info">
            <ul style="margin-left: 0; padding-left: 20px;">
              <li><span class="bold">Código:</span> ${item.codigo}</li>
              <li><span class="bold">Item:</span> ${item.item}</li>
              <li><span class="bold">Detalhes:</span> ${item.modelo ? `${item.modelo}, ` : ''}${item.detalhes || 'Mouse, Teclado, Web Cam e Headset'}</li>
              <li><span class="bold">Número de Série:</span> ${item.numero_serie || '-'}</li>
            </ul>
          </div>
          
          <div class="content">
            O aparelho será utilizado, exclusivamente, pelo <span class="bold">EMPREGADO</span>, <span class="bold">${colaboradorSelecionado.nome.toUpperCase()}</span>, que exerce a 
            função <span class="bold">${colaboradorSelecionado.cargo.toUpperCase()}</span>, portador do CPF <span class="bold">${colaboradorSelecionado.cpf}</span>, e sob sua responsabilidade, conforme 
            as seguintes condições:
          </div>
          
          <div class="clause">
            <span class="bold">1.</span> O equipamento deverá ser utilizado <span class="bold">ÚNICA E EXCLUSIVAMENTE</span> a serviço da empresa tendo em vista a 
            atividade exercida pelo <span class="bold">EMPREGADO</span>, supra informado.
          </div>
          
          <div class="clause">
            <span class="bold">2.</span> O <span class="bold">EMPREGADO</span> somente utilizará o aparelho para se comunicar através de ligação, mensagens 
            corporativas de "WhatsApp", ou por outro meio disponível, no horário de seu expediente, devendo ser 
            respeitado o horário comercial.
          </div>
          
          <div class="clause">
            <span class="bold">3.</span> A contratação do plano de telefonia será realizada diretamente pela empresa, ficando o <span class="bold">EMPREGADO</span> isento 
            de realizar qualquer pagamento referente ao uso do aparelho.
          </div>
          
          <div class="clause">
            <span class="bold">4.</span> O <span class="bold">EMPREGADO</span> não poderá contratar qualquer pacote adicional, sem a prévia comunicação e autorização 
            da <span class="bold">EMPREGADORA</span>.
          </div>
          
          <div class="clause">
            <span class="bold">5.</span> O <span class="bold">EMPREGADO</span> tem somente a <span class="bold">POSSE</span> do aparelho e do chip, supra informados, em razão do uso 
            exclusivo para prestação de serviços profissionais e <span class="bold">NÃO A PROPRIEDADE</span> dos equipamentos, sendo, 
            terminantemente, proibidos os empréstimos, aluguel ou cessão deste a terceiros, ou qualquer outro tipo uso, 
            sem a prévia e expressa autorização da <span class="bold">EMPREGADORA</span>.
          </div>
          
          <div class="clause">
            <span class="bold">6.</span> Ao término da prestação de serviço ou do contrato individual de trabalho, o <span class="bold">EMPREGADO</span> se compromete a 
            devolver o equipamento em perfeito estado de conservação, no mesmo dia em que for comunicado ou que 
            comunique a rescisão do contrato de trabalho, ressalvados os desgastes naturais pelo uso normal dos 
            equipamentos.
          </div>
          
          <div class="clause">
            <span class="bold">7.</span> Em caso de dano, inutilização, roubo/furto ou extravio dos equipamentos, a <span class="bold">EMPREGADORA</span> deverá ser, 
            imediatamente, comunicada.
          </div>
          
          <div class="clause">
            <span class="bold">8.</span> Se os equipamentos forem danificados ou inutilizados, por dolo ou culpa, exclusiva, do <span class="bold">EMPREGADO</span>, em 
            razão de uso inadequado ou mau uso, a <span class="bold">EMPREGADORA</span>, poderá exigir o ressarcimento no valor referente ao 
            equipamento e/ou seus acessórios, nos exatos termos do art. 462, § 1º, da CLT.
          </div>
          
          <div class="signatures">
            <div class="signature-left">
              <div class="signature-line"></div>
              <div>${colaboradorSelecionado.nome.toUpperCase()}</div>
              <div>CPF: ${colaboradorSelecionado.cpf}</div>
            </div>
            <div class="signature-right">
              <div class="signature-line"></div>
              <div>${empresaInfo.nome}</div>
              <div>CNPJ: ${empresaInfo.cnpj}</div>
            </div>
          </div>
          
          <div class="location-date">
            ${localData} - ${dataAtual}
          </div>
          
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Termo de Responsabilidade</h2>
            <p className="text-sm text-gray-600 mt-1">Gere o termo de responsabilidade para o colaborador.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Item */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Item Selecionado</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Código:</span> {item.codigo}</div>
              <div><span className="font-medium">Item:</span> {item.item}</div>
              <div><span className="font-medium">Modelo:</span> {item.modelo || 'N/A'}</div>
              <div><span className="font-medium">Número de Série:</span> {item.numero_serie || 'N/A'}</div>
            </div>
          </div>

          {/* Tipo de Pessoa */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tipo de Pessoa</h3>
            <p className="text-sm text-gray-600 mb-4">Selecione o tipo de pessoa para adaptar o termo.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTipoPessoa('PF')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  tipoPessoa === 'PF'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="font-semibold">PESSOA FÍSICA</div>
              </button>
              
              <button
                onClick={() => setTipoPessoa('PJ')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  tipoPessoa === 'PJ'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="font-semibold">PESSOA JURÍDICA</div>
              </button>
            </div>
          </div>

          {/* Seleção de Colaborador */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Selecione o Colaborador</h3>
            <p className="text-sm text-gray-600 mb-4">Escolha qual colaborador receberá o termo de responsabilidade.</p>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por nome, CPF ou setor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Lista de Colaboradores */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {loadingColaboradores ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Carregando colaboradores...</p>
                </div>
              ) : colaboradoresFiltrados.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhum colaborador encontrado
                </div>
              ) : (
                colaboradoresFiltrados.map((colaborador) => (
                  <div
                    key={colaborador.id}
                    onClick={() => setColaboradorSelecionado(colaborador)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      colaboradorSelecionado?.id === colaborador.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={colaboradorSelecionado?.id === colaborador.id}
                        onChange={() => setColaboradorSelecionado(colaborador)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{colaborador.nome}</div>
                        <div className="text-sm text-gray-600">{colaborador.cpf} • {colaborador.setor}</div>
                        <div className="text-sm text-gray-500">{colaborador.cargo}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Colaborador Selecionado */}
            {colaboradorSelecionado && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium text-green-800">Colaborador selecionado:</span>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  <div><strong>{colaboradorSelecionado.nome}</strong></div>
                  <div>{colaboradorSelecionado.cpf} • {colaboradorSelecionado.setor}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={gerarTermo}
            disabled={!colaboradorSelecionado}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gerar Termo
          </button>
        </div>
      </div>
    </div>
  )
}