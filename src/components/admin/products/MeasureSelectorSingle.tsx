'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface MeasureSelectorSingleProps {
  value?: string
  onChange: (measure: string) => void
  placeholder?: string
  className?: string
  error?: string
}

// Medidas predefinidas comunes (fallback)
const PREDEFINED_MEASURES = [
  '1L',
  '2.5L',
  '4L',
  '5L',
  '10L',
  '20L',
  '25L',
  '1KG',
  '4KG',
  '10KG',
  '20KG',
  'Nº10',
  'Nº12',
  'Nº14',
  'Nº16',
  'Nº18',
  'Nº20',
  '250ml',
  '500ml',
  '750ml',
]

export function MeasureSelectorSingle({
  value = '',
  onChange,
  placeholder = 'Selecciona o agrega medida',
  className,
  error,
}: MeasureSelectorSingleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customMeasure, setCustomMeasure] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [allMeasures, setAllMeasures] = useState<string[]>(PREDEFINED_MEASURES)
  const [isLoadingMeasures, setIsLoadingMeasures] = useState(false)

  // Cargar medidas desde la API (predefinidas + personalizadas)
  useEffect(() => {
    const loadMeasures = async () => {
      setIsLoadingMeasures(true)
      try {
        const response = await fetch('/api/admin/measures')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAllMeasures(result.data)
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando medidas personalizadas, usando solo predefinidas:', error)
      } finally {
        setIsLoadingMeasures(false)
      }
    }

    loadMeasures()
  }, [])

  const selectedMeasure = value || ''
  const availableMeasures = allMeasures.filter(m => m !== selectedMeasure)

  const filteredMeasures = searchTerm
    ? availableMeasures.filter(m =>
        m.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableMeasures

  const handleSelectMeasure = (measure: string) => {
    onChange(measure)
    setIsOpen(false)
    setSearchTerm('')
    setCustomMeasure('')
  }

  const handleClearMeasure = () => {
    onChange('')
  }

  const handleCustomMeasure = () => {
    const measureToAdd = customMeasure.trim()
    if (measureToAdd) {
      handleSelectMeasure(measureToAdd)
      
      // Si la medida no está en allMeasures, agregarla localmente
      if (!allMeasures.includes(measureToAdd)) {
        setAllMeasures([...allMeasures, measureToAdd])
      }
      
      setCustomMeasure('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Measure as Chip */}
      {selectedMeasure && (
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blaze-orange-100 text-blaze-orange-800 border border-blaze-orange-200'>
            {selectedMeasure}
            <button
              type='button'
              onClick={handleClearMeasure}
              className='ml-2 hover:text-blaze-orange-900'
              aria-label={`Eliminar ${selectedMeasure}`}
            >
              <X className='w-3 h-3' />
            </button>
          </span>
        </div>
      )}

      {/* Dropdown Button */}
      <div className='relative w-full'>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-left',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 bg-white'
          )}
        >
          <span className={cn('text-sm', !selectedMeasure ? 'text-gray-500' : 'text-gray-900')}>
            {selectedMeasure || placeholder}
          </span>
          <Plus className='w-4 h-4 text-gray-400' />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col min-w-full w-full'>
            {/* Search */}
            <div className='p-3 border-b border-gray-200 flex-shrink-0'>
              <input
                type='text'
                placeholder='Buscar medidas...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                autoFocus
              />
            </div>

            {/* Available Measures - Scrollable */}
            {filteredMeasures.length > 0 && (
              <div className='flex-1 overflow-y-auto min-h-0 p-2'>
                <div className='text-xs text-gray-500 mb-2 px-2'>
                  Medidas disponibles:
                  {isLoadingMeasures && <span className='ml-2'>(cargando...)</span>}
                </div>
                <div className='grid grid-cols-2 gap-1'>
                  {filteredMeasures.map((measure, index) => (
                    <button
                      key={`${measure}-${index}`}
                      type='button'
                      onClick={() => handleSelectMeasure(measure)}
                      className='px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-50 rounded border border-gray-200 hover:border-blaze-orange-300 transition-colors'
                    >
                      {measure}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Measure Input - Always visible at bottom */}
            <div className='border-t border-gray-200 p-3 space-y-2 flex-shrink-0'>
              <div className='text-xs text-gray-500 mb-2'>O agregar medida personalizada:</div>
              <div className='flex items-center gap-2 w-full'>
                <input
                  type='text'
                  placeholder='Ej: 15L, 30KG'
                  value={customMeasure}
                  onChange={e => setCustomMeasure(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customMeasure.trim()) {
                      e.preventDefault()
                      handleCustomMeasure()
                    }
                  }}
                  className='flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                />
                <button
                  type='button'
                  onClick={handleCustomMeasure}
                  disabled={!customMeasure.trim()}
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

      {/* Error Message */}
      {error && (
        <p className='text-red-600 text-sm mt-1'>{error}</p>
      )}
    </div>
  )
}
