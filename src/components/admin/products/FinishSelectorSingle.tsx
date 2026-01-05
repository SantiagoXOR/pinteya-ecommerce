'use client'

import { useState, useEffect } from 'react'
import { X, Plus, ChevronDown } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface FinishSelectorSingleProps {
  value?: string | null
  onChange: (finish: string | null) => void
  placeholder?: string
  className?: string
  error?: string
  availableFinishes?: string[] // Terminaciones del producto para mostrar como botones
}

// Terminaciones predefinidas comunes (fallback)
const PREDEFINED_FINISHES = [
  'Mate',
  'Satinado',
  'Semi-brillante',
  'Brillante',
  'Rústico',
  'Texturizado',
  'Metálico',
  'Perlado',
  'Chrome',
]

export function FinishSelectorSingle({
  value = '',
  onChange,
  placeholder = 'Selecciona o agrega terminación',
  className,
  error,
  availableFinishes = [],
}: FinishSelectorSingleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customFinish, setCustomFinish] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [allFinishes, setAllFinishes] = useState<string[]>(PREDEFINED_FINISHES) // Inicializar con predefinidas
  const [isLoadingFinishes, setIsLoadingFinishes] = useState(false)

  // Cargar terminaciones desde la API (predefinidas + personalizadas)
  useEffect(() => {
    const loadFinishes = async () => {
      setIsLoadingFinishes(true)
      try {
        const response = await fetch('/api/admin/finishes')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAllFinishes(result.data)
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando terminaciones personalizadas, usando solo predefinidas:', error)
        // Si falla, mantener las predefinidas
      } finally {
        setIsLoadingFinishes(false)
      }
    }

    loadFinishes()
  }, [])

  const selectedFinish = value || ''
  const availableFinishesList = allFinishes.filter(
    f => f.toLowerCase() !== selectedFinish.toLowerCase()
  )

  const filteredFinishes = searchTerm
    ? availableFinishesList.filter(f =>
        f.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableFinishesList

  const handleSelectFinish = (finish: string) => {
    onChange(finish)
    setSearchTerm('')
    setCustomFinish('')
    setIsOpen(false)
  }

  const handleClearFinish = () => {
    onChange(null) // ✅ Cambiar a null en lugar de string vacío
    setCustomFinish('')
  }

  const handleCustomFinish = async () => {
    const finishToAdd = customFinish.trim()
    if (finishToAdd) {
      // ✅ NUEVO: Guardar terminación en la paleta si no existe
      try {
        const response = await fetch('/api/admin/finishes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ finish: finishToAdd }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            console.log(`✅ Terminación "${finishToAdd}" guardada en paleta automáticamente`)
            // Recargar terminaciones para incluir la nueva
            const reloadResponse = await fetch('/api/admin/finishes')
            if (reloadResponse.ok) {
              const reloadResult = await reloadResponse.json()
              if (reloadResult.success && reloadResult.data) {
                setAllFinishes(reloadResult.data)
              }
            }
          }
        } else {
          console.warn(`⚠️ No se pudo guardar terminación en paleta:`, await response.text())
        }
      } catch (error) {
        console.warn(`⚠️ Error al guardar terminación en paleta:`, error)
        // Continuar aunque falle el guardado en paleta
      }

      handleSelectFinish(finishToAdd)
      
      // Si la terminación no está en allFinishes, agregarla localmente
      if (!allFinishes.includes(finishToAdd)) {
        setAllFinishes([...allFinishes, finishToAdd])
      }
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Finish Display */}
      {selectedFinish && (
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blaze-orange-100 text-blaze-orange-800 border border-blaze-orange-200'>
            {selectedFinish}
            <button
              type='button'
              onClick={handleClearFinish}
              className='ml-2 hover:text-blaze-orange-900'
              aria-label={`Eliminar ${selectedFinish}`}
            >
              <X className='w-3 h-3' />
            </button>
          </span>
        </div>
      )}

      {/* Botones para usar terminaciones del producto */}
      {availableFinishes.length > 0 && !selectedFinish && (
        <div className='flex gap-1 flex-wrap mb-2'>
          {availableFinishes.map((finish, idx) => (
            <button
              key={idx}
              type='button'
              onClick={() => handleSelectFinish(finish)}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blaze-orange-100 text-blaze-orange-800 border border-blaze-orange-200 hover:bg-blaze-orange-200 transition-colors'
            >
              Usar: {finish}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown Button */}
      <div className='relative w-full'>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-left',
            error ? 'border-red-300' : 'border-gray-300 bg-white',
            selectedFinish ? 'text-gray-900' : 'text-gray-500'
          )}
        >
          <span className='text-sm'>
            {selectedFinish || placeholder}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden min-w-full w-full'>
            {/* Search */}
            <div className='p-3 border-b border-gray-200'>
              <input
                type='text'
                placeholder='Buscar terminaciones...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                autoFocus
              />
            </div>

            {/* Available Finishes */}
            {filteredFinishes.length > 0 && (
              <div className='max-h-48 overflow-y-auto p-2'>
                <div className='text-xs text-gray-500 mb-2 px-2'>
                  Terminaciones disponibles:
                  {isLoadingFinishes && <span className='ml-2'>(cargando...)</span>}
                </div>
                <div className='grid grid-cols-2 gap-1'>
                  {filteredFinishes.map((finish) => (
                    <button
                      key={finish}
                      type='button'
                      onClick={() => handleSelectFinish(finish)}
                      className={cn(
                        'px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-50 rounded border border-gray-200 hover:border-blaze-orange-300 transition-colors',
                        selectedFinish === finish && 'bg-blaze-orange-50 border-blaze-orange-300'
                      )}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Finish Input */}
            <div className='border-t border-gray-200 p-3 space-y-2'>
              <div className='text-xs text-gray-500 mb-2'>O agregar terminación personalizada:</div>
              <div className='flex items-center gap-2 w-full'>
                <input
                  type='text'
                  placeholder='Ej: Especial, Personalizado'
                  value={customFinish}
                  onChange={e => setCustomFinish(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customFinish.trim()) {
                      e.preventDefault()
                      handleCustomFinish()
                    }
                  }}
                  className='flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                />
                <button
                  type='button'
                  onClick={handleCustomFinish}
                  disabled={!customFinish.trim()}
                  className='flex-shrink-0 px-3 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                >
                  <Plus className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay */}
        {isOpen && <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />}
      </div>

      {/* Error message */}
      {error && <p className='text-red-600 text-sm mt-1'>{error}</p>}
    </div>
  )
}

