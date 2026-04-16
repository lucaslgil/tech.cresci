# Padrão de Interface do Sistema
**Data:** 04/12/2025  
**Versão:** 1.0

## 🎨 Paleta de Cores Oficial

```
PRIMARY (Cabeçalhos/Botões): #394353
BORDER (Bordas):             #C9C4B5  
SECONDARY:                   #1E293B (descontinuado)
```

## 📏 Padrões de Tipografia

### Títulos e Cabeçalhos
- **Título Principal (H1):** `text-base font-semibold` (16px)
- **Subtítulo:** `text-xs text-gray-600` (12px)
- **Título de Card/Modal:** `text-base font-bold` (16px)
- **Título de Seção:** `text-sm font-semibold` (14px)

### Textos
- **Labels de Formulário:** `text-xs font-medium text-gray-700` (12px)
- **Inputs/Campos:** `text-sm` (14px)
- **Textos de Tabela:** `text-xs` (12px)
- **Textos Auxiliares:** `text-xs text-gray-500` (12px)

## 📦 Espaçamento e Padding

### Containers Principais
```tsx
<div className="min-h-screen bg-gray-50 p-4">
```

### Cards e Painéis
```tsx
<div className="bg-white p-3 rounded-lg shadow">
```

### Modais
```tsx
<div className="p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
```

### Tabelas
- **Cabeçalho:** `px-4 py-2.5`
- **Células:** `px-4 py-2.5`

### Formulários
- **Grid Gap:** `gap-3`
- **Margin Bottom:** `mb-4`

## 🎯 Componentes Padrão

### Botão Principal
```tsx
<button
  style={{ backgroundColor: '#394353' }}
  className="hover:opacity-90 text-white px-6 py-2.5 rounded-md flex items-center gap-2 transition-all text-sm font-semibold shadow-sm"
>
  <Icon className="w-4 h-4" />
  Texto do Botão
</button>
```

### Botão Secundário
```tsx
<button
  className="px-6 py-2.5 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-all"
  style={{ borderColor: '#C9C4B5' }}
>
  Cancelar
</button>
```

### Input de Texto
```tsx
<input
  type="text"
  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
  style={{ borderColor: '#C9C4B5' }}
/>
```

### Campo de Data (OBRIGATÓRIO — nunca usar `<input type="date">`)

Sempre usar o componente `DatePickerInput` (quando o valor é `string YYYY-MM-DD`) ou `DatePicker` (quando o valor é `Date | null`). Eles exibem o calendário visual com localização pt-BR.

```tsx
import { DatePickerInput, DateRangePicker } from '../../shared/components/DatePicker'

// Campo único (string YYYY-MM-DD)
<DatePickerInput
  value={dataString}          // 'yyyy-MM-dd' ou ''
  onChange={setDataString}    // (value: string) => void
  placeholder="dd/mm/aaaa"
/>

// Range de datas (início e fim)
<DateRangePicker
  startDate={inicio}          // Date | null
  endDate={fim}               // Date | null
  onStartDateChange={setInicio}
  onEndDateChange={setFim}
  startPlaceholder="Data início"
  endPlaceholder="Data fim"
/>
```

**Localização:** calendário em português (pt-BR), semana começa no domingo.  
**Arquivo fonte:** `src/shared/components/DatePicker.tsx`  
**Referência de uso:** `src/features/vendas/NovaVenda.tsx`

> ❌ Nunca usar `<input type="date" />` diretamente — o seletor nativo é diferente em cada navegador e não segue o padrão visual do sistema.

### Select/Dropdown
```tsx
<select
  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
  style={{ borderColor: '#C9C4B5' }}
>
  <option>Opção</option>
</select>
```

### Textarea
```tsx
<textarea
  rows={3}
  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
  style={{ borderColor: '#C9C4B5' }}
/>
```

## 📊 Tabelas

### Estrutura Completa
```tsx
<table className="min-w-full divide-y" style={{ borderColor: '#C9C4B5' }}>
  <thead style={{ backgroundColor: '#394353' }}>
    <tr>
      <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
        Coluna
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y" style={{ borderColor: '#C9C4B5' }}>
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900">
        Conteúdo
      </td>
    </tr>
  </tbody>
</table>
```

## 🃏 Cards

### Card de Listagem
```tsx
<div 
  className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow" 
  style={{ borderColor: '#C9C4B5' }}
>
  <h3 className="text-sm font-semibold text-gray-900">Título</h3>
  <p className="text-xs text-gray-600">Subtítulo</p>
  <div className="space-y-2 text-xs mt-2">
    {/* Conteúdo */}
  </div>
</div>
```

## 🔔 Notificações e Alertas

### Toast de Sucesso
```tsx
<div className="p-3 rounded-md mb-4 text-sm bg-green-100 text-green-700 border border-green-400">
  Mensagem de sucesso
</div>
```

### Toast de Erro
```tsx
<div className="p-3 rounded-md mb-4 text-sm bg-red-100 text-red-700 border border-red-400">
  Mensagem de erro
</div>
```

## 🪟 Modais

### Estrutura de Modal
```tsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
  <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
    {/* Header */}
    <div 
      className="flex justify-between items-center mb-4 pb-3" 
      style={{ borderBottomWidth: '2px', borderBottomColor: '#C9C4B5' }}
    >
      <h3 className="text-base font-bold text-gray-900">Título do Modal</h3>
      <button className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    
    {/* Conteúdo */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      {/* Campos do formulário */}
    </div>
    
    {/* Footer */}
    <div 
      className="flex justify-end space-x-3 pt-3" 
      style={{ borderTopWidth: '2px', borderTopColor: '#C9C4B5' }}
    >
      <button>Cancelar</button>
      <button>Salvar</button>
    </div>
  </div>
</div>
```

## 🔍 Campo de Busca

```tsx
<div className="relative flex-1 max-w-md">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
  <input
    type="text"
    placeholder="Buscar..."
    className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:border-transparent text-sm"
    style={{ borderColor: '#C9C4B5' }}
  />
</div>
```

## 📱 Ícones

### Tamanhos Padrão
- **Título Principal:** `w-5 h-5` com `color: #394353`
- **Botões:** `w-4 h-4`
- **Ícones de Card:** `w-3.5 h-3.5`
- **Ícones de Ação:** `w-4 h-4`

### Exemplo
```tsx
<Building className="w-5 h-5" style={{ color: '#394353' }} />
```

## 🎨 Estados de Elementos

### Botão Desabilitado
```tsx
disabled:opacity-50 disabled:cursor-not-allowed
```

### Hover em Botões
```tsx
hover:opacity-90 transition-all
```

### Hover em Linhas de Tabela
```tsx
hover:bg-gray-50
```

## 📋 Labels Obrigatórios

Campos obrigatórios devem ter asterisco:
```tsx
<label className="block text-xs font-medium text-gray-700 mb-1">
  Nome *
</label>
```

## 🎯 Checklist de Implementação

Ao criar uma nova tela, certifique-se de:

- [ ] Container principal com `min-h-screen bg-gray-50 p-4`
- [ ] Título com `text-base font-semibold`
- [ ] Subtítulo com `text-xs text-gray-600`
- [ ] Botões com cor `#394353`
- [ ] Bordas com cor `#C9C4B5`
- [ ] Tabelas com cabeçalho `#394353` e texto branco
- [ ] Fontes: `text-xs` para labels e tabelas, `text-sm` para inputs
- [ ] Padding reduzido: `p-3` ou `p-4`
- [ ] Gap entre elementos: `gap-3`
- [ ] Ícones com tamanho `w-4 h-4` ou `w-5 h-5`
- [ ] Transições suaves com `transition-all`
- [ ] Estados de hover definidos

## 💡 Exemplos de Referência

Consulte os seguintes arquivos como referência:
- `src/features/vendas/NovaVenda.tsx` - Formulários complexos
- `src/features/vendas/ListagemVendas.tsx` - Tabelas e listagens
- `src/features/empresa/CadastroEmpresa.tsx` - Modais e CRUD
- `src/features/financeiro/ParametrosContasReceber.tsx` - Cards e configurações

## 🚫 Evitar

- ❌ `<input type="date" />` diretamente — usar sempre `DatePickerInput` ou `DatePicker`
- ❌ Cores antigas: `#1E293B`, `bg-blue-600`, `text-blue-600`
- ❌ Fontes grandes: `text-2xl`, `text-xl`, `text-lg`
- ❌ Padding excessivo: `p-6`, `px-8`
- ❌ Gap grande: `gap-6`, `gap-4` (use `gap-3`)
- ❌ Classes de cor padrão do Tailwind para primary (use inline style)

## 📝 Notas Importantes

1. **Consistência é fundamental** - Todas as telas devem seguir o mesmo padrão
2. **Profissionalismo** - Fontes menores e espaçamento reduzido transmitem seriedade
3. **Performance** - Use classes Tailwind sempre que possível, inline styles apenas para cores da marca
4. **Acessibilidade** - Mantenha contraste adequado e tamanhos de fonte legíveis
5. **Responsividade** - Use grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

**Última Atualização:** 04/12/2025  
**Mantido por:** Equipe de Desenvolvimento
