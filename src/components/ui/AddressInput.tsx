'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MapPin, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAddressValidation } from '@/hooks/useAddressValidation'
import { Button } from './button'

interface AddressInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean, error?: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  apiKey?: string
  showSuggestions?: boolean
  label?: string
  error?: string
}

export function AddressInput({
  value,
  onChange,
  onValidationChange,
  placeholder = 'Av. Corrientes 1234, Córdoba',
  className,
  disabled = false,
  required = false,
  apiKey,
  showSuggestions = true,
  label = 'Dirección',
  error
}: AddressInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const {
    address,
    setAddress,
    validationResult,
    isValidationInProgress,
    suggestions,
    isSuggestionsLoading,
    selectSuggestion,
    clearValidation
  } = useAddressValidation({
    apiKey,
    debounceMs: 500,
    minLength: 5
  })

  // Sincronizar valor externo con estado interno
  useEffect(() => {
    if (value !== address) {
      setAddress(value)
    }
  }, [value, setAddress, address])

  // Notificar cambios de validación al componente padre
  useEffect(() => {
    if (validationResult) {
      onValidationChange?.(validationResult.isInCordobaCapital, validationResult.error)
    }
  }, [validationResult, onValidationChange])

  // Manejar cambio de dirección
  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress)
    onChange(newAddress)
    setShowSuggestionsList(true)
  }

  // Manejar selección de sugerencia
  const handleSuggestionSelect = (suggestion: string) => {
    selectSuggestion(suggestion)
    onChange(suggestion)
    setShowSuggestionsList(false)
    inputRef.current?.blur()
  }

  // Manejar click fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Determinar estado visual del input
  const getInputState = () => {
    if (error) return 'error'
    if (validationResult?.isInCordobaCapital) return 'success'
    if (validationResult?.error && !validationResult.isInCordobaCapital) return 'error'
    if (isValidationInProgress) return 'loading'
    return 'default'
  }

  const inputState = getInputState()

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            if (suggestions.length > 0) {
              setShowSuggestionsList(true)
            }
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 pl-10 pr-10 text-base border rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            {
              'border-red-500 focus:border-red-500': inputState === 'error',
              'border-green-500 focus:border-green-600': inputState === 'success',
              'border-gray-300 focus:border-blue-500': inputState === 'default',
              'border-blue-300 focus:border-blue-500': inputState === 'loading',
              'bg-gray-50 cursor-not-allowed': disabled,
            },
            className
          )}
        />

        {/* Iconos del input */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="w-5 h-5 text-gray-400" />
        </div>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isValidationInProgress && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {!isValidationInProgress && validationResult?.isInCordobaCapital && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {!isValidationInProgress && validationResult?.error && !validationResult.isInCordobaCapital && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {(error || validationResult?.error) && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error || validationResult?.error}
        </p>
      )}

      {/* Mensaje de éxito */}
      {validationResult?.isInCordobaCapital && !error && (
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Dirección válida en Córdoba Capital
        </p>
      )}

      {/* Sugerencias */}
      {showSuggestions && showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isSuggestionsLoading && (
            <div className="p-3 text-center text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              <span className="ml-2">Buscando direcciones...</span>
            </div>
          )}
          
          {!isSuggestionsLoading && suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Botón para limpiar */}
      {address && !disabled && (
        <button
          type="button"
          onClick={() => {
            handleAddressChange('')
            clearValidation()
            inputRef.current?.focus()
          }}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
