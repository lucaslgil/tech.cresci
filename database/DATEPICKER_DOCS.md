# DatePicker Moderno - Documentação

## Componente DatePicker Customizado

Sistema de seleção de datas moderno com **react-datepicker**, seguindo o padrão minimalista do sistema.

### Características

- ✅ **Interface moderna** e intuitiva
- ✅ **Localização em português** (pt-BR)
- ✅ **Design minimalista** seguindo padrão do sistema
- ✅ **Responsivo** para mobile e desktop
- ✅ **Validação de datas** (min/max)
- ✅ **Seleção de data e hora** opcional
- ✅ **Range de datas** (período)
- ✅ **Ícone de calendário** integrado

### Instalação

```bash
npm install react-datepicker @types/react-datepicker date-fns
```

### Componentes Disponíveis

#### 1. DatePicker (Seleção simples)

```tsx
import { DatePicker } from '@/shared/components/DatePicker'

// Uso básico
const [dataVenda, setDataVenda] = useState<Date | null>(null)

<DatePicker
  selected={dataVenda}
  onChange={setDataVenda}
  placeholder="Selecione a data"
/>

// Com validação
<DatePicker
  selected={dataVenda}
  onChange={setDataVenda}
  placeholder="Data do vencimento"
  minDate={new Date()} // Não permite datas passadas
  required
/>

// Com data e hora
<DatePicker
  selected={dataHora}
  onChange={setDataHora}
  placeholder="Data e hora"
  showTimeSelect
  dateFormat="dd/MM/yyyy HH:mm"
/>
```

#### 2. DateRangePicker (Período)

```tsx
import { DateRangePicker } from '@/shared/components/DatePicker'

const [dataInicio, setDataInicio] = useState<Date | null>(null)
const [dataFim, setDataFim] = useState<Date | null>(null)

<DateRangePicker
  startDate={dataInicio}
  endDate={dataFim}
  onStartDateChange={setDataInicio}
  onEndDateChange={setDataFim}
  startPlaceholder="Data inicial"
  endPlaceholder="Data final"
/>
```

### Props do DatePicker

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `selected` | `Date \| null` | - | Data selecionada |
| `onChange` | `(date: Date \| null) => void` | - | Callback ao alterar data |
| `placeholder` | `string` | `"Selecione uma data"` | Texto placeholder |
| `disabled` | `boolean` | `false` | Desabilita o campo |
| `minDate` | `Date` | - | Data mínima permitida |
| `maxDate` | `Date` | - | Data máxima permitida |
| `showTimeSelect` | `boolean` | `false` | Habilita seleção de hora |
| `dateFormat` | `string` | `"dd/MM/yyyy"` | Formato de exibição |
| `className` | `string` | - | Classes CSS adicionais |
| `required` | `boolean` | `false` | Campo obrigatório |

### Props do DateRangePicker

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `startDate` | `Date \| null` | - | Data inicial |
| `endDate` | `Date \| null` | - | Data final |
| `onStartDateChange` | `(date: Date \| null) => void` | - | Callback data inicial |
| `onEndDateChange` | `(date: Date \| null) => void` | - | Callback data final |
| `startPlaceholder` | `string` | `"Data inicial"` | Placeholder inicial |
| `endPlaceholder` | `string` | `"Data final"` | Placeholder final |
| `disabled` | `boolean` | `false` | Desabilita campos |
| `className` | `string` | - | Classes CSS adicionais |

### Exemplos de Uso

#### Formulário de Cadastro

```tsx
<div>
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Data de Nascimento *
  </label>
  <DatePicker
    selected={formData.dataNascimento}
    onChange={(date) => setFormData({ ...formData, dataNascimento: date })}
    placeholder="Selecione a data"
    maxDate={new Date()} // Não permite datas futuras
    required
  />
</div>
```

#### Filtro de Relatórios

```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Período
    </label>
    <DateRangePicker
      startDate={filtros.dataInicio}
      endDate={filtros.dataFim}
      onStartDateChange={(date) => setFiltros({ ...filtros, dataInicio: date })}
      onEndDateChange={(date) => setFiltros({ ...filtros, dataFim: date })}
    />
  </div>
</div>
```

#### Agendamento com Hora

```tsx
<DatePicker
  selected={dataAgendamento}
  onChange={setDataAgendamento}
  placeholder="Data e hora do agendamento"
  showTimeSelect
  dateFormat="dd/MM/yyyy HH:mm"
  minDate={new Date()}
  required
/>
```

### Conversão de Dados

#### De Date para string (ISO)

```tsx
const dateToString = (date: Date | null): string => {
  return date ? date.toISOString().split('T')[0] : ''
}

// Uso
onChange={(date) => setFormData({ 
  ...formData, 
  dataVenda: dateToString(date) 
})}
```

#### De string (ISO) para Date

```tsx
const stringToDate = (dateString: string): Date | null => {
  return dateString ? new Date(dateString) : null
}

// Uso
<DatePicker
  selected={stringToDate(formData.dataVenda)}
  onChange={(date) => setFormData({ 
    ...formData, 
    dataVenda: dateToString(date) 
  })}
/>
```

### Customização

O estilo do DatePicker pode ser customizado em `src/shared/components/DatePicker.css`:

- Cores do tema
- Tamanhos de fonte
- Espaçamentos
- Bordas e sombras
- Estados hover/focus

### Telas Atualizadas

✅ **Nova Venda** - Seletor de data e validade do orçamento
✅ **Listagem de Vendas** - Filtro de período (range)
🔄 **Próximas**: Cadastros, relatórios, agendamentos

### Vantagens sobre `<input type="date">`

1. **Visual consistente** em todos navegadores
2. **Melhor UX** com calendário interativo
3. **Localização** em português brasileiro
4. **Validações** integradas (min/max)
5. **Seleção de hora** quando necessário
6. **Range de datas** nativo
7. **Responsivo** e touch-friendly

---

**Última atualização**: 02/12/2025
