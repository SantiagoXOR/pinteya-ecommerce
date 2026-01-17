"use client"

import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import CategoryTogglePills from '@/components/Home/CategoryTogglePills'

export interface ImprovedFiltersProps {
  variant?: 'horizontal' | 'sidebar'
  // Categorías
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
  // Medidas / tamaños
  sizeOptions: string[]
  selectedSizes: string[]
  onSizesChange: (sizes: string[]) => void
  // Colores
  colorOptions?: { name: string; hex: string }[]
  selectedColors: string[]
  onColorsChange: (colors: string[]) => void
  // Marcas
  brands?: { name: string; slug: string; logo?: string }[]
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void
  // Precio
  priceRanges?: string[]
  selectedPriceRanges?: string[]
  onPriceRangesChange?: (ranges: string[]) => void
  // Envío
  freeShippingOnly?: boolean
  onFreeShippingChange?: (enabled: boolean) => void
  // Acciones
  onClearAll?: () => void
}

/**
 * Agrupa medidas por tipo (litros, kilogramos, números, granos, etc.)
 */
const groupMeasures = (measures: string[]) => {
  const litros = measures.filter(m => /^\d+(\.\d+)?L$/i.test(m)).sort((a, b) => parseFloat(a) - parseFloat(b))
  const kilos = measures.filter(m => /^\d+(\.\d+)?KG$/i.test(m)).sort((a, b) => parseFloat(a) - parseFloat(b))
  const numeros = measures.filter(m => /^N°?\d+/i.test(m)).sort((a, b) => {
    const aNum = parseInt(a.replace(/^N°?/, ''))
    const bNum = parseInt(b.replace(/^N°?/, ''))
    return aNum - bNum
  })
  const granos = measures.filter(m => /^Grano\s+\d+/i.test(m)).sort((a, b) => {
    const aNum = parseInt(a.replace(/^Grano\s+/i, ''))
    const bNum = parseInt(b.replace(/^Grano\s+/i, ''))
    return aNum - bNum
  })
  const gramos = measures.filter(m => /^\d+GR$/i.test(m)).sort((a, b) => parseInt(a) - parseInt(b))
  const dimensiones = measures.filter(m => /\d+mm/i.test(m) || /\d+cm/i.test(m))
  const otros = measures.filter(m => 
    !litros.includes(m) && !kilos.includes(m) && !numeros.includes(m) && 
    !granos.includes(m) && !gramos.includes(m) && !dimensiones.includes(m)
  )
  
  return { litros, kilos, numeros, granos, gramos, dimensiones, otros }
}

/**
 * Componente de filtros mejorado usando shadcn/ui
 * - Accordion para secciones colapsables
 * - Checkboxes para multi-select
 * - Solo nombres de marcas (sin logos)
 * - Mejor UX móvil y desktop
 */
export const ImprovedFilters: React.FC<ImprovedFiltersProps> = ({
  variant = 'horizontal',
  selectedCategories,
  onCategoryChange,
  sizeOptions,
  selectedSizes,
  onSizesChange,
  colorOptions,
  selectedColors,
  onColorsChange,
  brands = [],
  selectedBrands,
  onBrandsChange,
  priceRanges = ['Menos de $10.000', '$10.000 - $25.000', '$25.000 - $50.000', '$50.000 - $100.000', 'Más de $100.000'],
  selectedPriceRanges = [],
  onPriceRangesChange,
  freeShippingOnly = false,
  onFreeShippingChange,
  onClearAll,
}) => {
  const isHorizontal = variant === 'horizontal'

  // Calcular total de filtros activos
  const activeFiltersCount =
    selectedCategories.length + 
    selectedSizes.length + 
    selectedColors.length + 
    selectedBrands.length + 
    (selectedPriceRanges?.length || 0) +
    (freeShippingOnly ? 1 : 0)

  // Handler para toggle de checkbox
  const handleToggle = (value: string, selected: string[], onChange: (values: string[]) => void) => {
    const isSelected = selected.includes(value)
    const next = isSelected ? selected.filter(s => s !== value) : [...selected, value]
    onChange(next)
  }

  if (isHorizontal) {
    // ✅ FIX: Layout mobile-first - vertical en mobile, horizontal en desktop
    // Fondo transparente/semi-transparente para tema oscuro
    return (
      <div className='bg-white/10 backdrop-blur-sm rounded-lg shadow-sm px-3 py-3 sm:px-4 md:px-4 mb-4 sm:mb-6 border border-white/20'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-3'>
          <div className='flex items-center gap-2'>
            <Filter className='h-5 w-5 sm:h-4 sm:w-4 text-white' />
            <span className='font-medium text-base sm:text-sm text-white'>Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant='secondary' className='ml-1'>
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {onClearAll && activeFiltersCount > 0 && (
            <Button variant='ghost' size='sm' onClick={onClearAll} className='h-10 sm:h-8 text-sm sm:text-xs w-full sm:w-auto'>
              <X className='h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1' />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Categorías (mantener estilo actual) */}
        <div className='mb-3'>
          <CategoryTogglePills
            selectedCategories={selectedCategories}
            onCategoryChange={onCategoryChange}
            variant='bare'
          />
        </div>

        {/* Accordion para otros filtros */}
        <Accordion type='multiple' className='w-full'>
          {/* Medidas */}
          {sizeOptions.length > 0 && (() => {
            const grouped = groupMeasures(sizeOptions)
            return (
              <AccordionItem value='medidas' className='border-none'>
                <AccordionTrigger className='py-3 sm:py-2 text-base sm:text-sm font-medium hover:no-underline text-white min-h-[44px]'>
                  Medidas {selectedSizes.length > 0 && `(${selectedSizes.length})`}
                </AccordionTrigger>
                <AccordionContent className='pt-2'>
                  <ScrollArea className='h-[250px] sm:h-[300px] pr-2 sm:pr-4'>
                    <div className='space-y-4'>
                      {grouped.litros.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Litros</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.litros.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {grouped.kilos.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Kilogramos</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.kilos.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {grouped.gramos.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Gramos</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.gramos.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {grouped.numeros.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Números/Tamaños</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.numeros.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {grouped.granos.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Granos (Lijas)</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.granos.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {grouped.dimensiones.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Dimensiones</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.dimensiones.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {grouped.otros.length > 0 && (
                        <div>
                          <p className='text-xs sm:text-xs font-semibold text-white/70 mb-2'>Otros</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2'>
                            {grouped.otros.map(size => (
                              <div key={size} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                                <Checkbox
                                  id={`size-${size}`}
                                  checked={selectedSizes.includes(size)}
                                  onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                                  className='w-5 h-5 sm:w-4 sm:h-4'
                                />
                                <label htmlFor={`size-${size}`} className='text-base sm:text-sm cursor-pointer text-white flex-1'>
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            )
          })()}

          {/* Marcas */}
          {brands.length > 0 && (
            <AccordionItem value='marcas' className='border-none'>
              <AccordionTrigger className='py-3 sm:py-2 text-base sm:text-sm font-medium hover:no-underline text-white min-h-[44px]'>
                Marcas {selectedBrands.length > 0 && `(${selectedBrands.length})`}
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
                <ScrollArea className='h-[200px] sm:h-[200px] pr-2 sm:pr-4'>
                  <div className='space-y-3 sm:space-y-2'>
                    {brands.map(brand => (
                      <div key={brand.slug} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                        <Checkbox
                          id={`brand-${brand.slug}`}
                          checked={selectedBrands.includes(brand.slug)}
                          onCheckedChange={() => handleToggle(brand.slug, selectedBrands, onBrandsChange)}
                          className='w-5 h-5 sm:w-4 sm:h-4'
                        />
                        <label
                          htmlFor={`brand-${brand.slug}`}
                          className='text-base sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-white flex-1'
                        >
                          {brand.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Colores */}
          {colorOptions && colorOptions.length > 0 && (
            <AccordionItem value='colores' className='border-none'>
              <AccordionTrigger className='py-3 sm:py-2 text-base sm:text-sm font-medium hover:no-underline text-white min-h-[44px]'>
                Colores {selectedColors.length > 0 && `(${selectedColors.length})`}
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
                <ScrollArea className='h-[200px] sm:h-[200px] pr-2 sm:pr-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2'>
                    {colorOptions.map(color => (
                      <div key={color.name} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                        <Checkbox
                          id={`color-${color.name}`}
                          checked={selectedColors.includes(color.name)}
                          onCheckedChange={() => handleToggle(color.name, selectedColors, onColorsChange)}
                          className='w-5 h-5 sm:w-4 sm:h-4'
                        />
                        <label
                          htmlFor={`color-${color.name}`}
                          className='text-base sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-3 sm:gap-2 flex-1'
                        >
                          <span
                            className='w-5 h-5 sm:w-4 sm:h-4 rounded-full border border-gray-300 flex-shrink-0'
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Precio */}
          {onPriceRangesChange && priceRanges.length > 0 && (
            <AccordionItem value='precio' className='border-none'>
              <AccordionTrigger className='py-3 sm:py-2 text-base sm:text-sm font-medium hover:no-underline text-white min-h-[44px]'>
                Precio {selectedPriceRanges && selectedPriceRanges.length > 0 && `(${selectedPriceRanges.length})`}
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
                <div className='space-y-3 sm:space-y-2 pr-2 sm:pr-4'>
                  {priceRanges.map((range, idx) => (
                    <div key={`price-${idx}`} className='flex items-center space-x-3 sm:space-x-2 min-h-[44px]'>
                      <Checkbox
                        id={`price-${idx}`}
                        checked={selectedPriceRanges?.includes(range) || false}
                        onCheckedChange={() => handleToggle(range, selectedPriceRanges || [], onPriceRangesChange)}
                        className='w-5 h-5 sm:w-4 sm:h-4'
                      />
                        <label
                          htmlFor={`price-${idx}`}
                          className='text-base sm:text-sm font-medium leading-none cursor-pointer text-white flex-1'
                        >
                        {range}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Envío Gratis */}
          {onFreeShippingChange && (
            <AccordionItem value='envio' className='border-none'>
              <AccordionTrigger className='py-3 sm:py-2 text-base sm:text-sm font-medium hover:no-underline text-white min-h-[44px]'>
                Envío
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
                <div className='flex items-center space-x-3 sm:space-x-2 pr-2 sm:pr-4 min-h-[44px]'>
                  <Checkbox
                    id='envio-gratis'
                    checked={freeShippingOnly}
                    onCheckedChange={(checked) => onFreeShippingChange(checked as boolean)}
                    className='w-5 h-5 sm:w-4 sm:h-4'
                  />
                  <label
                    htmlFor='envio-gratis'
                    className='text-base sm:text-sm font-medium leading-none cursor-pointer text-white flex-1'
                  >
                    Solo productos con envío gratis
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    )
  }

  // Layout sidebar (vertical)
  return (
    <div className='bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 space-y-4 border border-white/20'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-white' />
          <h3 className='font-semibold text-sm text-white'>Filtros</h3>
          {activeFiltersCount > 0 && (
            <Badge variant='secondary' className='ml-1'>
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {onClearAll && activeFiltersCount > 0 && (
          <Button variant='ghost' size='sm' onClick={onClearAll} className='h-8 px-2'>
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      <Accordion type='multiple' defaultValue={['categorias', 'medidas', 'marcas']} className='w-full'>
        {/* Categorías */}
        <AccordionItem value='categorias'>
          <AccordionTrigger className='text-sm'>
            Categorías {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </AccordionTrigger>
          <AccordionContent>
            <CategoryTogglePills
              selectedCategories={selectedCategories}
              onCategoryChange={onCategoryChange}
              variant='default'
            />
          </AccordionContent>
        </AccordionItem>

        {/* Medidas */}
        {sizeOptions.length > 0 && (
          <AccordionItem value='medidas'>
            <AccordionTrigger className='text-sm'>
              Medidas {selectedSizes.length > 0 && `(${selectedSizes.length})`}
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className='h-[250px]'>
                <div className='grid grid-cols-2 gap-2 pr-4'>
                  {sizeOptions.map(size => (
                    <div key={size} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`sidebar-size-${size}`}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleToggle(size, selectedSizes, onSizesChange)}
                      />
                      <label
                        htmlFor={`sidebar-size-${size}`}
                        className='text-sm font-medium leading-none cursor-pointer'
                      >
                        {size}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Marcas */}
        {brands.length > 0 && (
          <AccordionItem value='marcas'>
            <AccordionTrigger className='text-sm'>
              Marcas {selectedBrands.length > 0 && `(${selectedBrands.length})`}
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className='h-[250px]'>
                <div className='space-y-2 pr-4'>
                  {brands.map(brand => (
                    <div key={brand.slug} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`sidebar-brand-${brand.slug}`}
                        checked={selectedBrands.includes(brand.slug)}
                        onCheckedChange={() => handleToggle(brand.slug, selectedBrands, onBrandsChange)}
                      />
                      <label
                        htmlFor={`sidebar-brand-${brand.slug}`}
                        className='text-sm font-medium leading-none cursor-pointer flex-1'
                      >
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Colores */}
        {colorOptions && colorOptions.length > 0 && (
          <AccordionItem value='colores'>
            <AccordionTrigger className='text-sm'>
              Colores {selectedColors.length > 0 && `(${selectedColors.length})`}
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className='h-[250px]'>
                <div className='grid grid-cols-1 gap-2 pr-4'>
                  {colorOptions.map(color => (
                    <div key={color.name} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`sidebar-color-${color.name}`}
                        checked={selectedColors.includes(color.name)}
                        onCheckedChange={() => handleToggle(color.name, selectedColors, onColorsChange)}
                      />
                      <label
                        htmlFor={`sidebar-color-${color.name}`}
                        className='text-sm font-medium leading-none cursor-pointer flex items-center gap-2 flex-1'
                      >
                        <span
                          className='w-5 h-5 rounded-full border-2 border-gray-300'
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

export default ImprovedFilters

