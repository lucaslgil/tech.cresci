// =====================================================
// COMPONENTE - DATE PICKER CUSTOMIZADO
// Seletor de data moderno com react-datepicker
// Seguindo padrão minimalista do sistema
// Data: 02/12/2025
// =====================================================

import React, { forwardRef } from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
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

// Input customizado para o DatePicker
const CustomInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, placeholder, disabled, className }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        className={`w-full px-2 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer ${className || ''}`}
      />
      <Calendar className="absolute right-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
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
