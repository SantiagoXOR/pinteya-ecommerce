'use client'

import { useState, useMemo, useEffect } from 'react'
import { Palette, X } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { PAINT_COLORS, ColorOption } from '@/components/ui/advanced-color-picker'

interface ColorPickerFieldProps {
  colorName?: string
  colorHex?: string
  onColorChange: (colorName: string, colorHex?: string) => void
  label?: string
  className?: string
  error?: string
}

export function ColorPickerField({
  colorName = '',
  colorHex,
  onColorChange,
  label = 'Color',
  className,
  error,
}: ColorPickerFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [customName, setCustomName] = useState(colorName || '')
  const [allColors, setAllColors] = useState<ColorOption[]>(PAINT_COLORS) // Inicializar con predefinidos
  const [isLoadingColors, setIsLoadingColors] = useState(false)

  // Cargar colores desde la API (predefinidos + personalizados)
  useEffect(() => {
    const loadColors = async () => {
      setIsLoadingColors(true)
      try {
        const response = await fetch('/api/admin/colors')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAllColors(result.data)
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando colores personalizados, usando solo predefinidos:', error)
        // Si falla, mantener los predefinidos
      } finally {
        setIsLoadingColors(false)
      }
    }

    loadColors()
  }, [])

  // Sincronizar customName cuando cambia colorName externamente
  useEffect(() => {
    setCustomName(colorName || '')
  }, [colorName])

  // Buscar el color en la paleta por nombre o hex
  const selectedColorOption = useMemo(() => {
    if (!colorName && !colorHex) return null
    
    // Buscar por nombre primero
    const byName = allColors.find(
      c => c.name.toLowerCase() === colorName.toLowerCase() || 
           c.displayName.toLowerCase() === colorName.toLowerCase()
    )
    if (byName) return byName

    // Buscar por hex
    if (colorHex) {
      const byHex = allColors.find(c => c.hex.toLowerCase() === colorHex.toLowerCase())
      if (byHex) return byHex
    }

    return null
  }, [colorName, colorHex, allColors])

  const handlePaletteColorSelect = (color: ColorOption) => {
    onColorChange(color.displayName, color.hex)
    setCustomName(color.displayName)
    setIsPickerOpen(false)
  }

  const handleNameChange = (name: string) => {
    setCustomName(name)
    // Si hay un hex seleccionado, mantenerlo; si no, buscar en paleta
    const color = allColors.find(
      c => c.name.toLowerCase() === name.toLowerCase() || 
           c.displayName.toLowerCase() === name.toLowerCase()
    )
    if (color) {
      onColorChange(color.displayName, color.hex)
    } else {
      onColorChange(name, colorHex || undefined)
    }
  }

  const handleHexChange = (hex: string) => {
    // Buscar si el hex corresponde a un color conocido
    const color = allColors.find(c => c.hex.toLowerCase() === hex.toLowerCase())
    if (color) {
      onColorChange(color.displayName, color.hex)
      setCustomName(color.displayName)
    } else {
      onColorChange(customName || colorName, hex)
    }
  }

  const handleClearColor = () => {
    onColorChange('', undefined)
    setCustomName('')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className='block text-sm font-medium text-gray-700'>{label}</label>
      
      {/* Preview y controles */}
      <div className='flex items-center gap-2'>
        {/* Color preview */}
        {(colorHex || selectedColorOption) && (
          <div
            className='w-10 h-10 rounded-lg border-2 border-gray-300 flex-shrink-0'
            style={{ backgroundColor: colorHex || selectedColorOption?.hex }}
          />
        )}
        
        {/* Nombre del color */}
        <div className='flex-1'>
          <input
            type='text'
            value={customName}
            onChange={(e) => handleNameChange(e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blaze-orange-500',
              error ? 'border-red-300' : 'border-gray-300'
            )}
            placeholder='Ej: Blanco, Rojo Óxido'
          />
        </div>

        {/* Color picker nativo */}
        <input
          type='color'
          value={colorHex || selectedColorOption?.hex || '#ffffff'}
          onChange={(e) => handleHexChange(e.target.value)}
          className='w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer flex-shrink-0'
          title='Seleccionar color'
        />

        {/* Botón abrir paleta */}
        <button
          type='button'
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={cn(
            'p-2 rounded-lg border-2 transition-colors flex-shrink-0',
            isPickerOpen
              ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700'
              : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900'
          )}
          title='Abrir paleta de colores'
        >
          <Palette className='w-5 h-5' />
        </button>

        {/* Botón limpiar */}
        {(colorName || colorHex) && (
          <button
            type='button'
            onClick={handleClearColor}
            className='p-2 rounded-lg border-2 border-gray-300 hover:border-red-300 text-gray-600 hover:text-red-600 transition-colors flex-shrink-0'
            title='Limpiar color'
          >
            <X className='w-5 h-5' />
          </button>
        )}
      </div>

      {/* Paleta de colores */}
      {isPickerOpen && (
        <div className='mt-2 p-4 border border-gray-200 rounded-lg bg-white shadow-lg'>
          <div className='mb-2'>
            <h4 className='text-sm font-medium text-gray-700 mb-2'>
              Seleccionar de paleta
              {isLoadingColors && <span className='ml-2 text-xs text-gray-500'>(cargando...)</span>}
            </h4>
            <div className='grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto'>
              {allColors.filter(c => c.isPopular).map((color, index) => (
                <button
                  key={`color-${color.id || color.hex}-${index}`}
                  type='button'
                  onClick={() => handlePaletteColorSelect(color)}
                  className={cn(
                    'relative w-8 h-8 rounded border-2 transition-all hover:scale-110',
                    selectedColorOption?.id === color.id
                      ? 'border-blaze-orange-500 ring-2 ring-blaze-orange-200'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.displayName}
                />
              ))}
            </div>
            {allColors.filter(c => !c.isPopular).length > 0 && (
              <details className='mt-2'>
                <summary className='text-xs text-gray-500 hover:text-gray-700 cursor-pointer'>
                  Ver todos los colores ({allColors.length})
                </summary>
                <div className='grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto mt-2'>
                  {allColors.map((color, index) => (
                    <button
                      key={`color-all-${color.id || color.hex}-${index}`}
                      type='button'
                      onClick={() => handlePaletteColorSelect(color)}
                      className={cn(
                        'relative w-8 h-8 rounded border-2 transition-all hover:scale-110',
                        selectedColorOption?.id === color.id
                          ? 'border-blaze-orange-500 ring-2 ring-blaze-orange-200'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.displayName}
                    />
                  ))}
                </div>
              </details>
            )}
            <button
              type='button'
              onClick={() => setIsPickerOpen(false)}
              className='mt-2 text-xs text-gray-500 hover:text-gray-700'
            >
              Cerrar paleta
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className='text-red-600 text-sm mt-1'>{error}</p>}
    </div>
  )
}
