# Padrão de Estilização do Sistema - Tech Cresci e Perdi

## Data de Criação
04 de Novembro de 2025

## Objetivo
Este documento define o padrão visual e de componentes a ser seguido em todas as telas do sistema, garantindo consistência, responsividade e uma experiência de usuário moderna.

---

## 🎨 Paleta de Cores

### Cores Principais
- **Slate**: Usado para textos, botões principais e elementos de interface
  - `bg-slate-50`: Backgrounds secundários
  - `bg-slate-700`: Botões primários
  - `bg-slate-800`: Hover de botões primários
  - `text-slate-600`: Textos de cabeçalhos de tabela
  - `text-slate-700`: Textos de botões secundários
  - `text-slate-900`: Títulos principais

### Cores de Status
- **Verde**: Sucesso, disponível, ativo
  - `bg-green-50`, `border-green-200`, `text-green-800`
- **Vermelho**: Erro, inativo, excluir
  - `bg-red-50`, `border-red-200`, `text-red-800`
- **Roxo**: eSIM, importação
  - `bg-purple-100`, `text-purple-800`
- **Azul**: Informação, links
  - `bg-blue-50`, `text-blue-600`

---

## 📐 Estrutura de Layout

### Container Principal
```tsx
<div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
  {/* Conteúdo */}
</div>
```
**Características**:
- Padding responsivo: `p-3` (mobile) → `sm:p-4` (tablet) → `md:p-6` (desktop)
- Previne overflow horizontal

---

## 🎯 Componentes Padrão

### 1. Cabeçalho da Página

```tsx
<div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
  <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Título e Contador */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Título da Página
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {items.length} {items.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
        </p>
      </div>
      
      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Botões aqui */}
      </div>
    </div>
  </div>
</div>
```

**Características**:
- Background branco com sombra sutil
- Border bottom para separação
- Layout flexível (coluna em mobile, linha em desktop)
- Contador dinâmico de registros
- Espaçamento responsivo

---

### 2. Botões de Ação

#### Botão Primário (Adicionar/Criar)
```tsx
<button
  onClick={() => handleAction()}
  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
>
  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  <span className="sm:inline">Adicionar</span>
</button>
```

#### Botão Secundário (Download/Importar)
```tsx
<button
  onClick={handleDownload}
  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-slate-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
>
  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  <span className="sm:inline">Baixar Modelo</span>
</button>
```

#### Input File (Importar Excel)
```tsx
<label className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-slate-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer">
  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
  <span className="sm:inline">Importar Excel</span>
  <input
    type="file"
    accept=".xlsx,.xls"
    onChange={handleImport}
    className="hidden"
    disabled={loading}
  />
</label>
```

**Ordem Padrão dos Botões** (esquerda → direita):
1. **Baixar Modelo** (branco/cinza)
2. **Importar Excel** (branco/cinza)
3. **Adicionar/Criar** (slate escuro)

---

### 3. Tabela de Dados

```tsx
<div className="bg-white shadow rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
            Coluna
          </th>
          {/* Mais colunas */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {item.name}
            </td>
            {/* Mais células */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Características**:
- Background branco com sombra
- Header com `bg-slate-50`
- Hover sutil nas linhas (`hover:bg-slate-50`)
- Padding responsivo
- Scroll horizontal automático em mobile

---

### 4. Estado Vazio

```tsx
<div className="bg-white shadow rounded-lg">
  <div className="text-center py-12">
    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Ícone apropriado */}
    </svg>
    <p className="text-gray-500 text-lg font-medium">
      Nenhum item cadastrado
    </p>
    <p className="text-gray-400 text-sm mt-1">
      Clique em "Adicionar" para começar
    </p>
  </div>
</div>
```

---

### 5. Badges de Status

```tsx
{/* Verde - Ativo/Disponível */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Ativo
</span>

{/* Vermelho - Inativo */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Inativo
</span>

{/* Roxo - eSIM/Especial */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
  eSIM
</span>
```

---

### 6. Botões de Ação na Tabela

```tsx
<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
  <button
    onClick={() => handleEdit(item)}
    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
  >
    Editar
  </button>
  <button
    onClick={() => handleDelete(item.id)}
    className="text-red-600 hover:text-red-900 font-medium transition-colors"
  >
    Excluir
  </button>
</td>
```

---

### 7. Modal de Resultado (Importação)

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
    {/* Header */}
    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900">
        Resultado da Importação
      </h2>
      <button
        onClick={() => setShowModal(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs sm:text-sm text-green-700 mb-1 font-medium">
            Importadas com Sucesso
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-900">
            {successCount}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-xs sm:text-sm text-red-700 mb-1 font-medium">
            Erros Encontrados
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-900">
            {errorCount}
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end rounded-b-lg">
      <button
        onClick={() => setShowModal(false)}
        className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
      >
        Fechar
      </button>
    </div>
  </div>
</div>
```

---

## 📱 Responsividade

### Breakpoints Tailwind
- **sm**: ≥ 640px (tablets pequenos)
- **md**: ≥ 768px (tablets)
- **lg**: ≥ 1024px (desktops)
- **xl**: ≥ 1280px (desktops grandes)

### Padrões de Responsividade

#### Padding
```tsx
p-3 sm:p-4 md:p-6    // Container principal
px-4 sm:px-6         // Padding horizontal de cards
```

#### Tamanhos de Texto
```tsx
text-xs sm:text-sm   // Botões e labels
text-xl sm:text-2xl  // Títulos principais
text-sm              // Textos de tabela
```

#### Ícones
```tsx
w-4 h-4 sm:w-5 sm:h-5   // Ícones em botões
```

#### Layout
```tsx
flex flex-col sm:flex-row     // Muda de coluna para linha
gap-2 sm:gap-3                // Espaçamento responsivo
grid grid-cols-1 sm:grid-cols-2  // Grid responsivo
```

---

## 🎭 Animações e Transições

### Hover States
```tsx
hover:bg-slate-50      // Linhas de tabela
hover:bg-slate-800     // Botões primários
hover:text-slate-900   // Links de ação
transition-colors      // Transição suave
```

### Focus States
```tsx
focus:outline-none
focus:ring-2
focus:ring-offset-2
focus:ring-slate-500
```

---

## 📋 Checklist de Implementação

Ao criar uma nova tela, certifique-se de:

- [ ] Usar container principal com padding responsivo
- [ ] Implementar cabeçalho padrão com título e contador
- [ ] Adicionar botões na ordem correta (Baixar → Importar → Adicionar)
- [ ] Aplicar cores da paleta slate para botões principais
- [ ] Implementar tabela com header `bg-slate-50`
- [ ] Adicionar hover states nas linhas (`hover:bg-slate-50`)
- [ ] Criar estado vazio amigável
- [ ] Usar badges coloridos para status
- [ ] Implementar responsividade completa
- [ ] Adicionar transições suaves
- [ ] Testar em mobile, tablet e desktop

---

## 🔍 Exemplos de Referência

### Telas que Seguem o Padrão
1. ✅ `/cadastro/colaborador` - CadastroColaborador.tsx
2. ✅ `/inventario/itens` - CadastroItem.tsx
3. ✅ `/inventario/linhas-telefonicas` - LinhasTelefonicas.tsx

Use essas telas como referência para implementar novas funcionalidades.

---

## 🛠️ Utilitários Tailwind Mais Usados

### Spacing
- `gap-2 sm:gap-3` - Espaçamento entre elementos flexbox/grid
- `space-x-3` - Espaçamento horizontal entre filhos
- `mb-4 sm:mb-6` - Margin bottom responsivo

### Typography
- `font-medium` - Peso médio
- `font-semibold` - Peso semi-negrito
- `font-bold` - Negrito
- `text-xs`, `text-sm`, `text-base` - Tamanhos de texto
- `uppercase`, `tracking-wider` - Transformações de texto

### Borders
- `border`, `border-gray-200` - Bordas sutis
- `rounded-lg`, `rounded-md` - Cantos arredondados
- `divide-y`, `divide-gray-200` - Divisores entre elementos

### Shadows
- `shadow` - Sombra padrão
- `shadow-sm` - Sombra sutil
- `shadow-xl` - Sombra pronunciada (modais)

---

## 📚 Recursos Adicionais

### Documentação Tailwind CSS
https://tailwindcss.com/docs

### Ícones Heroicons
https://heroicons.com (usados nos SVGs)

### Guia de Cores Tailwind
https://tailwindcss.com/docs/customizing-colors

---

## 📝 Notas Importantes

1. **Sempre use classes responsivas**: Comece mobile-first e adicione breakpoints
2. **Prefira Slate sobre Gray**: Para elementos de interface principais
3. **Mantenha consistência**: Se uma tela usa um padrão, todas devem usar
4. **Acessibilidade**: Sempre adicione `focus:` states e aria-labels quando apropriado
5. **Performance**: Use `transition-colors` ao invés de `transition-all`

---

## 🔄 Histórico de Atualizações

| Data | Alteração | Responsável |
|------|-----------|-------------|
| 04/11/2025 | Criação do documento com padrões baseados em CadastroColaborador e LinhasTelefonicas | Sistema |

---

**Última Atualização**: 04 de Novembro de 2025
