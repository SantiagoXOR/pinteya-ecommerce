'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { MeasurePill } from './MeasurePill'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'
import type { MeasurePillSelectorProps } from '../types'

const pillRowStyles: React.CSSProperties = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
  gap: 'clamp(0.25rem, 1vw, 0.375rem)',
  paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)',
  paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)',
  paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
  paddingRight: 'clamp(0.75rem, 2vw, 1rem)',
}

/**
 * Selector de medidas con scroll horizontal
 * Con autoScroll: efecto marquee (scroll automático) al hover/touch en el card cuando hay overflow
 */
export const MeasurePillSelector = React.memo(function MeasurePillSelector({
  measures,
  selectedMeasure,
  onMeasureSelect,
  commonUnit,
  colors = [],
  selectedColor,
  onColorSelect,
  onAddToCart,
  isAddingToCart = false,
  stock = 0,
  isImpregnante = false,
  autoScroll = false
}: MeasurePillSelectorProps) {
  if (measures.length === 0) {
    return null
  }

  const { scrollContainerRef, canScrollLeft, canScrollRight } = useHorizontalScroll({
    deps: [measures]
  })

  const hasOverflow = canScrollLeft || canScrollRight
  const useMarquee = autoScroll && hasOverflow

  const renderPills = () =>
    measures.map((measure) => (
      <MeasurePill
        key={measure}
        measure={measure}
        isSelected={selectedMeasure === measure}
        onSelect={onMeasureSelect}
      />
    ))

  if (useMarquee) {
    return (
      <div className='relative w-full overflow-hidden'>
        <div
          className='absolute inset-0 overflow-hidden'
          style={{ visibility: 'hidden', pointerEvents: 'none' }}
          aria-hidden
        >
          <div
            ref={scrollContainerRef}
            className='flex items-center overflow-x-auto overflow-y-hidden w-full h-full scrollbar-hide'
            style={pillRowStyles}
          >
            {renderPills()}
          </div>
        </div>
        <div
          className='flex items-center overflow-x-hidden w-full'
          style={{
            paddingTop: pillRowStyles.paddingTop,
            paddingBottom: pillRowStyles.paddingBottom,
            paddingLeft: pillRowStyles.paddingLeft,
            paddingRight: pillRowStyles.paddingRight
          }}
        >
          <div className='flex items-center whitespace-nowrap animate-pills-scroll-infinite' style={{ gap: pillRowStyles.gap }}>
            {renderPills()}
            {renderPills()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='relative w-full overflow-hidden'>
      {canScrollLeft && (
        <div
          className='absolute left-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent)' }}
        />
      )}
      <div
        ref={scrollContainerRef}
        className='flex items-center overflow-x-auto overflow-y-hidden scroll-smooth w-full scrollbar-hide'
        style={pillRowStyles}
      >
        {renderPills()}
      </div>
      {canScrollRight && (
        <div
          className='absolute right-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{ background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent)' }}
        />
      )}

      {/* DESACTIVADO TEMPORALMENTE: Botón ">" y Sheet modal
      {selectedMeasure && (colors.length > 1 || measures.length > 1) && (
        <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 flex-shrink-0 z-20 h-[18px] w-[18px] md:h-[20px] md:w-[20px]'>
          <div 
            className='absolute inset-0 rounded-full pointer-events-none'
            style={{
              background: 'rgba(250, 204, 21, 0.9)',
            }}
          />
          <Sheet open={showColorsSheet} onOpenChange={setShowColorsSheet}>
            <SheetTrigger asChild>
              <button
                type='button'
                onClick={(e) => e.stopPropagation()}
                aria-label='Ver todas las opciones de color y medidas'
                className='relative w-full h-full rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 transform-gpu will-change-transform bg-transparent'
                title='Ver todas las opciones'
              >
                <ChevronRight className='w-2.5 h-2.5 md:w-3 md:h-3 text-[#EA5A17]' />
              </button>
            </SheetTrigger>
            <SheetContent 
              side='bottom' 
              className='h-[50vh] md:h-auto md:max-h-[60vh]'
              onClick={(e) => e.stopPropagation()}
            >
              <SheetHeader>
                <SheetTitle>Seleccionar Opciones</SheetTitle>
              </SheetHeader>
              <div className='space-y-4 mt-4 overflow-y-auto max-h-[40vh] md:max-h-[50vh] p-2'>
                {colors.length > 0 && onColorSelect && (
                  <div>
                    <h3 className='text-xs sm:text-sm font-semibold text-gray-700 mb-2'>Color</h3>
                    <div className='grid grid-cols-4 md:grid-cols-5 gap-3'>
                      {colors.map((colorData) => {
                        const darker = darkenHex(colorData.hex, 0.35)
                        const woodTexture = isImpregnante ? getWoodTexture(colorData.hex, darker) : {}
                        
                        return (
                          <div key={colorData.hex} className='flex flex-col items-center gap-1'>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                onColorSelect(colorData.hex)
                              }}
                              title={colorData.name}
                              className={cn(
                                'w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-gray-200 shadow-sm transition-all hover:scale-110 active:scale-95',
                                selectedColor === colorData.hex && 'ring-2 ring-[#EA5A17] ring-offset-1'
                              )}
                              style={{
                                backgroundColor: colorData.hex === '#FFFFFF' || colorData.hex === '#ffffff' ? '#F5F5F5' : colorData.hex,
                                ...woodTexture
                              }}
                            />
                            <span className='text-[9px] md:text-[10px] text-gray-600 text-center max-w-[70px] truncate'>
                              {colorData.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className='text-xs sm:text-sm font-semibold text-gray-700 mb-2'>Medida</h3>
                  <div className='grid grid-cols-4 md:grid-cols-5 gap-2'>
                    {measures.map((measure) => {
                      const { number } = parseMeasure(measure)
                      return (
                        <button
                          key={measure}
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            onMeasureSelect(measure)
                          }}
                          className={cn(
                            'h-10 sm:h-12 md:h-14 rounded-lg text-xs sm:text-sm md:text-base font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center',
                            selectedMeasure === measure
                              ? 'bg-[#facc15] text-[#EA5A17] border-2 border-[#facc15] shadow-sm'
                              : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-[#EA5A17]'
                          )}
                        >
                          <span className='font-bold'>{number}</span>
                          <span className='text-[10px] sm:text-xs ml-0.5 font-normal'>{commonUnit}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              {onAddToCart && (
                <div className='flex justify-center pt-4 pb-2 border-t border-gray-200 mt-4'>
                  <button
                    type='button'
                    onClick={handleAddToCartClick}
                    disabled={isAddingToCart || stock === 0}
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center transition-transform shadow-md relative',
                      stock === 0 || isAddingToCart
                        ? 'bg-gray-200 cursor-not-allowed'
                        : 'bg-[#facc15] hover:scale-105 active:scale-95',
                      isAddingToCart && 'animate-pulse'
                    )}
                    style={{
                      ...(stock !== 0 && !isAddingToCart ? {
                        opacity: 1,
                      } : {})
                    }}
                    onMouseEnter={(e) => {
                      if (stock !== 0 && !isAddingToCart) {
                        const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement
                        if (overlay) overlay.style.opacity = '1'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (stock !== 0 && !isAddingToCart) {
                        const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement
                        if (overlay) overlay.style.opacity = '0'
                      }
                    }}
                  >
                    {stock !== 0 && !isAddingToCart && (
                      <span 
                        className="absolute inset-0 rounded-full bg-[#f5c000] opacity-0 hover-overlay transition-opacity duration-300 pointer-events-none"
                      />
                    )}
                    {isAddingToCart ? (
                      <div className='w-5 h-5 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <svg className='w-6 h-6 text-[#EA5A17] transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                      </svg>
                    )}
                  </button>
                </div>
              )}
              
              {showSuccessToast && (
                <div className='absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 fade-in duration-300 z-50'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  <span className='font-medium text-sm'>¡Agregado al carrito!</span>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      )}
      FIN DESACTIVADO TEMPORALMENTE */}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación de arrays de measures
  const prevMeasuresLength = prevProps.measures?.length || 0
  const nextMeasuresLength = nextProps.measures?.length || 0
  const prevColorsLength = prevProps.colors?.length || 0
  const nextColorsLength = nextProps.colors?.length || 0
  
  if (prevMeasuresLength !== nextMeasuresLength || prevColorsLength !== nextColorsLength) {
    return false
  }
  
  // Comparar strings de measures
  const measuresEqual = prevProps.measures.every((measure, idx) => 
    measure === nextProps.measures?.[idx]
  )
  
  // Comparar colores
  const colorsEqual = prevColorsLength === 0 || prevProps.colors.every((color, idx) => 
    color.hex === nextProps.colors?.[idx]?.hex
  )
  
  return (
    measuresEqual &&
    colorsEqual &&
    prevProps.selectedMeasure === nextProps.selectedMeasure &&
    prevProps.selectedColor === nextProps.selectedColor &&
    prevProps.commonUnit === nextProps.commonUnit &&
    prevProps.isAddingToCart === nextProps.isAddingToCart &&
    prevProps.stock === nextProps.stock &&
    prevProps.isImpregnante === nextProps.isImpregnante &&
    prevProps.autoScroll === nextProps.autoScroll &&
    prevProps.onMeasureSelect === nextProps.onMeasureSelect &&
    prevProps.onColorSelect === nextProps.onColorSelect &&
    prevProps.onAddToCart === nextProps.onAddToCart
  )
})

MeasurePillSelector.displayName = 'MeasurePillSelector'

