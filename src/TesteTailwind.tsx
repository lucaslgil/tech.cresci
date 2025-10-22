export function TesteTailwind() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Teste Básico de Cores */}
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold">TailwindCSS v3 - Teste de Cores</h1>
          <p className="mt-2">Este deve ter fundo AZUL com texto BRANCO</p>
        </div>

        {/* Teste de Gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold">Gradiente Azul para Roxo</h2>
          <p>Se você ver um gradiente suave, o TailwindCSS está funcionando!</p>
        </div>

        {/* Teste de Outras Cores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-500 text-white p-4 rounded text-center">
            <p className="font-semibold">Vermelho</p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded text-center">
            <p className="font-semibold">Verde</p>
          </div>
          <div className="bg-yellow-500 text-black p-4 rounded text-center">
            <p className="font-semibold">Amarelo</p>
          </div>
        </div>

        {/* Teste de Botões */}
        <div className="flex space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Botão Azul
          </button>
          <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-lg transition-colors">
            Botão Outline
          </button>
        </div>
        
      </div>
    </div>
  );
}