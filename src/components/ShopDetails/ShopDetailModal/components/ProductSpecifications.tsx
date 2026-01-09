/**
 * Componente de especificaciones técnicas del producto
 */

import React, { useState } from 'react'
import { Package, Ruler, Hash, FileText, ChevronDown, ChevronUp } from '@/lib/optimized-imports'

interface ProductWithCategory {
  description?: string
  specifications?: Record<string, any>
  features?: Record<string, any>
  weight?: string | number
  dimensions?: string | Record<string, any>
  sku?: string
  technical_sheet_url?: string | null
}

interface Product {
  description?: string
}

interface ProductSpecificationsProps {
  fullProductData: ProductWithCategory | null
  product: Product | null
  technicalSheetUrl?: string | null
}

// Número máximo de caracteres antes de truncar
const MAX_DESCRIPTION_LENGTH = 150

/**
 * Especificaciones del producto memoizadas
 */
export const ProductSpecifications = React.memo<ProductSpecificationsProps>(({
  fullProductData,
  product,
  technicalSheetUrl,
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  
  const hasSpecs = fullProductData?.specifications && Object.keys(fullProductData.specifications).length > 0
  const hasFeatures = fullProductData?.features && Object.keys(fullProductData.features).length > 0
  const description = fullProductData?.description || product?.description || ''
  const hasDescription = !!description
  const isDescriptionLong = description.length > MAX_DESCRIPTION_LENGTH
  
  // Technical sheet URL can come from prop or fullProductData
  const sheetUrl = technicalSheetUrl || fullProductData?.technical_sheet_url

  if (!hasSpecs && !hasFeatures && !hasDescription && !fullProductData?.weight && !fullProductData?.dimensions && !fullProductData?.sku && !sheetUrl) {
    return null
  }

  // Función para truncar la descripción
  const getDisplayDescription = () => {
    if (!isDescriptionLong || isDescriptionExpanded) {
      return description
    }
    return description.slice(0, MAX_DESCRIPTION_LENGTH).trim() + '...'
  }

  return (
    <div className='space-y-4'>
      {/* Descripción */}
      {hasDescription && (
        <div>
          <p className='text-gray-600 leading-relaxed text-sm'>
            {getDisplayDescription()}
          </p>
          {isDescriptionLong && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDescriptionExpanded(!isDescriptionExpanded)
              }}
              className='mt-2 text-sm font-medium text-blaze-orange-600 hover:text-blaze-orange-700 flex items-center gap-1 transition-colors'
            >
              {isDescriptionExpanded ? (
                <>
                  Ver menos
                  <ChevronUp className='w-4 h-4' />
                </>
              ) : (
                <>
                  Ver más
                  <ChevronDown className='w-4 h-4' />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Especificaciones técnicas */}
      {hasSpecs && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>Especificaciones Técnicas</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {Object.entries(fullProductData.specifications).map(([key, value]) => (
              <div key={key} className='flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg'>
                <span className='text-sm font-medium text-gray-700 capitalize'>
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className='text-sm text-gray-600'>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Características del producto */}
      {hasFeatures && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>Características</h3>
          <div className='space-y-2'>
            {Object.entries(fullProductData.features).map(([key, value]) => (
              <div key={key} className='flex items-start gap-2'>
                <div className='w-2 h-2 bg-blaze-orange-500 rounded-full mt-2 flex-shrink-0'></div>
                <div className='flex-1'>
                  <span className='text-sm font-medium text-gray-700 capitalize'>
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className='text-sm text-gray-600 ml-2'>{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className='space-y-2'>
        {fullProductData?.weight && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Package className='w-4 h-4' />
            <span>Peso: {fullProductData.weight}</span>
          </div>
        )}

        {fullProductData?.dimensions && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Ruler className='w-4 h-4' />
            <span>Dimensiones: {typeof fullProductData.dimensions === 'string' ? fullProductData.dimensions : JSON.stringify(fullProductData.dimensions)}</span>
          </div>
        )}

        {fullProductData?.sku && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Hash className='w-4 h-4' />
            <span>SKU: {fullProductData.sku}</span>
          </div>
        )}
      </div>

      {/* Ficha Técnica PDF */}
      {sheetUrl && (
        <div className='pt-3'>
          <a
            href={sheetUrl}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors'
          >
            <FileText className='w-4 h-4' />
            <span className='underline underline-offset-2'>Ver ficha técnica (PDF)</span>
          </a>
        </div>
      )}
    </div>
  )
})

ProductSpecifications.displayName = 'ProductSpecifications'

