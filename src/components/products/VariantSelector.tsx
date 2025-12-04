'use client'

import { ProductVariant } from '@/lib/api/product-variants'
import { cn } from '@/lib/core/utils'

interface Props {
  variants: ProductVariant[]
  selected: ProductVariant
  onSelect: (variant: ProductVariant) => void
}

export function VariantSelector({ variants, selected, onSelect }: Props) {
  if (!variants || variants.length === 0) {
    return null
  }

  // Extraer atributos únicos
  const uniqueMeasures = [...new Set(variants.map(v => v.measure).filter(Boolean))]
  const uniqueColors = [...new Set(variants.map(v => v.color_name).filter(Boolean))]
  const uniqueFinishes = [...new Set(variants.map(v => v.finish).filter(Boolean))]
  
  return (
    <div className="space-y-6">
      {/* Selector de Medida/Capacidad */}
      {uniqueMeasures.length > 1 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Medida:
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueMeasures.map(measure => {
              // Buscar variante compatible con selección actual
              const compatibleVariant = variants.find(v => 
                v.measure === measure &&
                (selected.color_name ? v.color_name === selected.color_name : true) &&
                (selected.finish ? v.finish === selected.finish : true)
              ) || variants.find(v => v.measure === measure)
              
              const isSelected = selected?.measure === measure
              const isAvailable = compatibleVariant && compatibleVariant.stock > 0
              
              return (
                <button
                  key={measure}
                  onClick={() => compatibleVariant && onSelect(compatibleVariant)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-6 py-3 rounded-lg border-2 font-medium transition-all",
                    isSelected 
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : isAvailable
                      ? "border-gray-300 hover:border-blue-400 bg-white text-gray-700"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {measure}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Selector de Color */}
      {uniqueColors.length > 1 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Color:
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map(color => {
              const compatibleVariant = variants.find(v => 
                v.color_name === color &&
                (selected.measure ? v.measure === selected.measure : true) &&
                (selected.finish ? v.finish === selected.finish : true)
              ) || variants.find(v => v.color_name === color)
              
              const isSelected = selected?.color_name === color
              const isAvailable = compatibleVariant && compatibleVariant.stock > 0
              
              return (
                <button
                  key={color}
                  onClick={() => compatibleVariant && onSelect(compatibleVariant)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-6 py-3 rounded-lg border-2 font-medium transition-all flex items-center gap-2",
                    isSelected 
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : isAvailable
                      ? "border-gray-300 hover:border-blue-400 bg-white text-gray-700"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {compatibleVariant?.color_hex && (
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: compatibleVariant.color_hex }}
                    />
                  )}
                  {color}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Selector de Acabado */}
      {uniqueFinishes.length > 1 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Acabado:
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueFinishes.map(finish => {
              const compatibleVariant = variants.find(v => 
                v.finish === finish &&
                (selected.measure ? v.measure === selected.measure : true) &&
                (selected.color_name ? v.color_name === selected.color_name : true)
              ) || variants.find(v => v.finish === finish)
              
              const isSelected = selected?.finish === finish
              const isAvailable = compatibleVariant && compatibleVariant.stock > 0
              
              return (
                <button
                  key={finish}
                  onClick={() => compatibleVariant && onSelect(compatibleVariant)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-6 py-3 rounded-lg border-2 font-medium transition-all",
                    isSelected 
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : isAvailable
                      ? "border-gray-300 hover:border-blue-400 bg-white text-gray-700"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {finish}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Info de variante */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm text-gray-500">
          <span className="font-medium">SKU:</span> {selected?.aikon_id || 'No disponible'}
        </div>
      </div>
    </div>
  )
}
