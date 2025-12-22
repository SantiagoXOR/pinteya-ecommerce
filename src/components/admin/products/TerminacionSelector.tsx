'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface TerminacionSelectorProps {
  value?: string[]
  onChange: (terminaciones: string[]) => void
  placeholder?: string
  className?: string
}

// Terminaciones predefinidas comunes (fallback)
const PREDEFINED_TERMINACIONES = [
  'Mate',
  'Satinado',
  'Semi-brillante',
  'Brillante',
  'Rústico',
  'Texturizado',
]

export function TerminacionSelector({
  value = [],
  onChange,
  placeholder = 'Selecciona o agrega terminaciones',
  className,
}: TerminacionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customTerminacion, setCustomTerminacion] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [allTerminaciones, setAllTerminaciones] = useState<string[]>(PREDEFINED_TERMINACIONES) // Inicializar con predefinidas
  const [isLoadingTerminaciones, setIsLoadingTerminaciones] = useState(false)

  // Cargar terminaciones desde la API (predefinidas + personalizadas)
  useEffect(() => {
    const loadTerminaciones = async () => {
      setIsLoadingTerminaciones(true)
      try {
        const response = await fetch('/api/admin/finishes')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAllTerminaciones(result.data)
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando terminaciones personalizadas, usando solo predefinidas:', error)
        // Si falla, mantener las predefinidas
      } finally {
        setIsLoadingTerminaciones(false)
      }
    }

    loadTerminaciones()
  }, [])

  const selectedTerminaciones = value || []
  const availableTerminaciones = allTerminaciones.filter(
    t => !selectedTerminaciones.includes(t)
  )

  const filteredTerminaciones = searchTerm
    ? availableTerminaciones.filter(t =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableTerminaciones

  const handleAddTerminacion = (terminacion: string) => {
    if (terminacion && !selectedTerminaciones.includes(terminacion)) {
      onChange([...selectedTerminaciones, terminacion])
      setSearchTerm('')
      setCustomTerminacion('')
    }
  }

  const handleRemoveTerminacion = (terminacion: string) => {
    onChange(selectedTerminaciones.filter(t => t !== terminacion))
  }

  const handleCustomTerminacion = async () => {
    const terminacionToAdd = customTerminacion.trim()
    if (terminacionToAdd && !selectedTerminaciones.includes(terminacionToAdd)) {
      // ✅ NUEVO: Guardar terminación en la paleta si no existe
      try {
        const response = await fetch('/api/admin/finishes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ finish: terminacionToAdd }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            console.log(`✅ Terminación "${terminacionToAdd}" guardada en paleta automáticamente`)
            // Recargar terminaciones para incluir la nueva
            const reloadResponse = await fetch('/api/admin/finishes')
            if (reloadResponse.ok) {
              const reloadResult = await reloadResponse.json()
              if (reloadResult.success && reloadResult.data) {
                setAllTerminaciones(reloadResult.data)
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

      handleAddTerminacion(terminacionToAdd)
      
      // Si la terminación no está en allTerminaciones, agregarla localmente
      if (!allTerminaciones.includes(terminacionToAdd)) {
        setAllTerminaciones([...allTerminaciones, terminacionToAdd])
      }
      
      setCustomTerminacion('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Terminaciones as Chips */}
      {selectedTerminaciones.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {selectedTerminaciones.map(terminacion => (
            <span
              key={terminacion}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blaze-orange-100 text-blaze-orange-800 border border-blaze-orange-200'
            >
              {terminacion}
              <button
                type='button'
                onClick={() => handleRemoveTerminacion(terminacion)}
                className='ml-2 hover:text-blaze-orange-900'
                aria-label={`Eliminar ${terminacion}`}
              >
                <X className='w-3 h-3' />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Button */}
      <div className='relative'>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-left',
            'border-gray-300 bg-white'
          )}
        >
          <span className={cn('text-sm', selectedTerminaciones.length === 0 ? 'text-gray-500' : 'text-gray-900')}>
            {selectedTerminaciones.length === 0 ? placeholder : `Agregar más terminaciones...`}
          </span>
          <Plus className='w-4 h-4 text-gray-400' />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden'>
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

            {/* Available Terminaciones */}
            {filteredTerminaciones.length > 0 && (
              <div className='max-h-48 overflow-y-auto p-2'>
                <div className='text-xs text-gray-500 mb-2 px-2'>
                  Terminaciones disponibles:
                  {isLoadingTerminaciones && <span className='ml-2'>(cargando...)</span>}
                </div>
                <div className='grid grid-cols-2 gap-1'>
                  {filteredTerminaciones.map(terminacion => (
                    <button
                      key={terminacion}
                      type='button'
                      onClick={() => handleAddTerminacion(terminacion)}
                      className='px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-50 rounded border border-gray-200 hover:border-blaze-orange-300 transition-colors'
                    >
                      {terminacion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Terminacion Input */}
            <div className='border-t border-gray-200 p-3 space-y-2'>
              <div className='text-xs text-gray-500 mb-2'>O agregar terminación personalizada:</div>
              <div className='flex items-center space-x-2'>
                <input
                  type='text'
                  placeholder='Ej: Especial, Personalizado'
                  value={customTerminacion}
                  onChange={e => setCustomTerminacion(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customTerminacion.trim()) {
                      e.preventDefault()
                      handleCustomTerminacion()
                    }
                  }}
                  className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent text-gray-900'
                />
                <button
                  type='button'
                  onClick={handleCustomTerminacion}
                  disabled={!customTerminacion.trim()}
                  className='px-3 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
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
    </div>
  )
}
