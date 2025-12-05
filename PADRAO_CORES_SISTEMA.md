# Padrão de Cores do Sistema

## Cores Oficiais

O sistema utiliza uma paleta de cores padronizada para manter consistência visual em todos os módulos.

### Paleta Principal

```
#1E293B - Primary Dark (Escuro Principal)
#C9C4B5 - Light Accent (Claro de Destaque)
#394353 - Secondary Dark (Escuro Secundário)
```

---

## Guia de Uso

### 1. **#1E293B - Primary Dark**
**Onde usar:**
- Cabeçalhos de tabelas
- Botões principais (Salvar, Confirmar, Adicionar)
- Títulos de seções importantes
- Elementos de destaque primário

**Exemplos de código:**
```tsx
// Cabeçalho de tabela
<thead style={{ backgroundColor: '#1E293B' }}>
  <tr>
    <th className="text-white">...</th>
  </tr>
</thead>

// Botão principal
<button 
  className="px-4 py-2 text-white rounded-md hover:opacity-90"
  style={{ backgroundColor: '#1E293B' }}
>
  Salvar
</button>

// Título
<h2 style={{ color: '#1E293B' }}>Título da Seção</h2>
```

---

### 2. **#C9C4B5 - Light Accent**
**Onde usar:**
- Bordas de elementos
- Separadores visuais
- Bordas de modais e cards
- Bordas de inputs

**Exemplos de código:**
```tsx
// Borda de modal
<div className="border" style={{ borderColor: '#C9C4B5' }}>
  ...
</div>

// Input
<input 
  className="w-full border rounded-md px-3 py-2"
  style={{ borderColor: '#C9C4B5' }}
/>

// Card
<div className="border rounded-lg p-4" style={{ borderColor: '#C9C4B5' }}>
  ...
</div>
```

---

### 3. **#394353 - Secondary Dark**
**Onde usar:**
- Textos descritivos
- Labels de formulário
- Subtítulos
- Texto secundário
- Botões de cancelar/fechar

**Exemplos de código:**
```tsx
// Label de formulário
<label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>
  Nome do Campo
</label>

// Descrição/subtítulo
<p style={{ color: '#394353' }}>Descrição explicativa</p>

// Botão secundário
<button 
  className="px-4 py-2 border rounded-md hover:bg-gray-50"
  style={{ borderColor: '#C9C4B5', color: '#394353' }}
>
  Cancelar
</button>
```

---

## Estrutura de Componentes Padrão

### Modal
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border" style={{ borderColor: '#C9C4B5' }}>
    {/* Título */}
    <h3 className="text-lg font-semibold mb-4" style={{ color: '#1E293B' }}>
      Título do Modal
    </h3>
    
    {/* Campos do formulário */}
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#394353' }}>
          Campo
        </label>
        <input 
          className="w-full border rounded-md px-3 py-2"
          style={{ borderColor: '#C9C4B5' }}
        />
      </div>
    </div>

    {/* Botões */}
    <div className="flex justify-end gap-3 mt-6">
      <button
        className="px-4 py-2 border rounded-md hover:bg-gray-50"
        style={{ borderColor: '#C9C4B5', color: '#394353' }}
      >
        Cancelar
      </button>
      <button
        className="px-4 py-2 text-white rounded-md hover:opacity-90"
        style={{ backgroundColor: '#1E293B' }}
      >
        Salvar
      </button>
    </div>
  </div>
</div>
```

### Tabela
```tsx
<table className="w-full">
  <thead style={{ backgroundColor: '#1E293B' }}>
    <tr>
      <th className="text-left text-white px-4 py-3">Coluna 1</th>
      <th className="text-left text-white px-4 py-3">Coluna 2</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-gray-50" style={{ borderColor: '#C9C4B5' }}>
      <td className="px-4 py-3">Valor</td>
      <td className="px-4 py-3">Valor</td>
    </tr>
  </tbody>
</table>
```

### Card de Seção
```tsx
<div className="border rounded-lg p-6 mb-6" style={{ borderColor: '#C9C4B5' }}>
  <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E293B' }}>
    Título da Seção
  </h3>
  <p className="text-sm mb-4" style={{ color: '#394353' }}>
    Descrição da seção
  </p>
  {/* Conteúdo */}
</div>
```

---

## Cores Complementares (TailwindCSS)

Para elementos que não precisam das cores oficiais:

- **Fundo claro:** `bg-gray-50` ou `bg-white`
- **Hover em linhas:** `hover:bg-gray-50`
- **Texto padrão:** `text-gray-900`
- **Ícones:** Usar a cor do contexto (#1E293B para principais, #394353 para secundários)

---

## Checklist de Implementação

Ao criar ou atualizar uma página, certifique-se de:

- [ ] Cabeçalhos de tabela usam `#1E293B` com texto branco
- [ ] Botões principais usam `#1E293B`
- [ ] Bordas de elementos usam `#C9C4B5`
- [ ] Labels e textos descritivos usam `#394353`
- [ ] Títulos de seção usam `#1E293B`
- [ ] Modais seguem a estrutura padrão
- [ ] Botões de cancelar usam borda `#C9C4B5` e texto `#394353`
- [ ] Inputs têm borda `#C9C4B5`

---

## Exemplos de Referência

Para ver exemplos completos de implementação das cores oficiais:

- `src/features/financeiro/ParametrosContasReceber.tsx` - Implementação completa de modais, tabelas e formulários
- `src/features/dashboard/Dashboard.tsx` - Uso em cards e módulos

---

## Notas Importantes

1. **Consistência:** Sempre use as cores oficiais para manter a identidade visual
2. **Contraste:** O `#1E293B` deve sempre usar texto branco (`text-white`)
3. **Hover States:** Use `hover:opacity-90` em botões principais
4. **Responsividade:** As cores devem funcionar bem em todos os tamanhos de tela
5. **Acessibilidade:** As combinações de cores atendem aos requisitos de contraste WCAG

---

**Data de criação:** 2025  
**Última atualização:** Janeiro 2025
