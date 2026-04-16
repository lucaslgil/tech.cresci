// =====================================================
// COMPONENTE - DATE PICKER CUSTOMIZADO
// Seletor de data moderno com react-datepicker
// Seguindo padrão minimalista do sistema
// Atualizado: 2026
// =====================================================

import React, { forwardRef } from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
import { format, isValid, parseISO } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'

// Registrar localização brasileira
registerLocale('pt-BR', ptBR)

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  showTimeSelect?: boolean
  dateFormat?: string
  className?: string
  required?: boolean
}

// Input customizado para o DatePicker — Estilo Tailwind UI
const CustomInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, placeholder, disabled, className }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder || 'dd/mm/aaaa'}
        disabled={disabled}
        readOnly
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
        className={`w-full pl-3 pr-9 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-shadow ${className || ''}`}
      />
      <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
)

CustomInput.displayName = 'CustomInput'

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholder = 'Selecione uma data',
  disabled = false,
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat = 'dd/MM/yyyy',
  className,
  required = false
}) => {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      locale="pt-BR"
      dateFormat={showTimeSelect ? 'dd/MM/yyyy HH:mm' : dateFormat}
      showTimeSelect={showTimeSelect}
      timeFormat="HH:mm"
      timeIntervals={15}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      required={required}
      placeholderText={placeholder}
      customInput={<CustomInput className={className} />}
      calendarClassName="modern-datepicker"
      popperPlacement="bottom-start"
      showPopperArrow={false}
    />
  )
}

// Componente para range de datas
interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  startPlaceholder?: string
  endPlaceholder?: string
  disabled?: boolean
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = 'Data inicial',
  endPlaceholder = 'Data final',
  disabled = false,
  className
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className || ''}`}>
      <DatePicker
        selected={startDate}
        onChange={onStartDateChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        maxDate={endDate || undefined}
      />
      <DatePicker
        selected={endDate}
        onChange={onEndDateChange}
        placeholder={endPlaceholder}
        disabled={disabled}
        minDate={startDate || undefined}
      />
    </div>
  )
}

// ── DatePickerInput ─────────────────────────────────────────────────────────
// Wrapper que aceita e retorna strings no formato YYYY-MM-DD
// Substitui diretamente <input type="date" value={str} onChange={(e) => setStr(e.target.value)} />
// ──────────────────────────────────────────────────────────────────────────────
interface DatePickerInputProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
  required?: boolean
  minDate?: Date
  maxDate?: Date
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  className,
  required = false,
  minDate,
  maxDate,
}) => {
  const parsed = value ? parseISO(value) : null
  const dateValue = parsed && isValid(parsed) ? parsed : null

  const handleChange = (date: Date | null) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : '')
  }

  return (
    <DatePicker
      selected={dateValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      required={required}
      minDate={minDate}
      maxDate={maxDate}
    />
  )
}
