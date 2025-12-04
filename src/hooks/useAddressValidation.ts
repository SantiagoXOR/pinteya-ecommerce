'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { validateAddressInCordobaCapital, getAddressSuggestions, AddressValidationResult } from '@/lib/services/addressValidation'

interface UseAddressValidationOptions {
  apiKey?: string
  debounceMs?: number
  minLength?: number
}

interface UseAddressValidationReturn {
  address: string
  setAddress: (address: string) => void
  validationResult: AddressValidationResult | null
  isValidationInProgress: boolean
  suggestions: string[]
  isSuggestionsLoading: boolean
  validateAddress: (address: string) => Promise<void>
  clearValidation: () => void
  selectSuggestion: (suggestion: string) => void
}

export function useAddressValidation({
  apiKey,
  debounceMs = 500,
  minLength = 5
}: UseAddressValidationOptions = {}): UseAddressValidationReturn {
  const [address, setAddress] = useState('')
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null)
  const [isValidationInProgress, setIsValidationInProgress] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validar dirección con debounce
  const validateAddress = useCallback(async (addressToValidate: string) => {
    if (addressToValidate.trim().length < minLength) {
      setValidationResult({
        isValid: false,
        isInCordobaCapital: false,
        error: `La dirección debe tener al menos ${minLength} caracteres`
      })
      return
    }

    setIsValidationInProgress(true)
    
    try {
      const result = await validateAddressInCordobaCapital(addressToValidate, apiKey)
      setValidationResult(result)
    } catch (error) {
      console.error('Error validando dirección:', error)
      setValidationResult({
        isValid: false,
        isInCordobaCapital: false,
        error: 'Error al validar la dirección'
      })
    } finally {
      setIsValidationInProgress(false)
    }
  }, [apiKey, minLength])

  // Obtener sugerencias con debounce
  const getSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([])
      return
    }

    setIsSuggestionsLoading(true)
    
    try {
      const suggestionsResult = await getAddressSuggestions(query, apiKey)
      setSuggestions(suggestionsResult)
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error)
      setSuggestions([])
    } finally {
      setIsSuggestionsLoading(false)
    }
  }, [apiKey])

  // Manejar cambio de dirección con debounce
  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress)
    
    // Limpiar timeouts anteriores
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current)
    }

    // Validar dirección
    timeoutRef.current = setTimeout(() => {
      validateAddress(newAddress)
    }, debounceMs)

    // Obtener sugerencias
    suggestionsTimeoutRef.current = setTimeout(() => {
      getSuggestions(newAddress)
    }, 300) // Menor debounce para sugerencias
  }, [validateAddress, getSuggestions, debounceMs])

  // Limpiar validación
  const clearValidation = useCallback(() => {
    setValidationResult(null)
    setSuggestions([])
    setIsValidationInProgress(false)
    setIsSuggestionsLoading(false)
  }, [])

  // Seleccionar sugerencia
  const selectSuggestion = useCallback((suggestion: string) => {
    setAddress(suggestion)
    setSuggestions([])
    validateAddress(suggestion)
  }, [validateAddress])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current)
      }
    }
  }, [])

  return {
    address,
    setAddress: handleAddressChange,
    validationResult,
    isValidationInProgress,
    suggestions,
    isSuggestionsLoading,
    validateAddress,
    clearValidation,
    selectSuggestion
  }
}
