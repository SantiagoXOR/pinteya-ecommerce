"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { X, Filter } from '@/lib/optimized-imports'
import CategoryTogglePills from '@/components/Home/CategoryTogglePills'
import {
  SizeFilterPills,
  ColorFilterPills,
  BrandFilterPills,
  PriceRangeFilterPills,
  FreeShippingPill,
} from './pills'

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
 * Retorna un objeto con claves de nombres de grupos y arrays de medidas
 */
const groupMeasures = (measures: string[]): Record<string, string[]> => {
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
  
  const grouped: Record<string, string[]> = {}
  if (litros.length > 0) grouped['Litros'] = litros
  if (kilos.length > 0) grouped['Kilogramos'] = kilos
  if (gramos.length > 0) grouped['Gramos'] = gramos
  if (numeros.length > 0) grouped['Números/Tamaños'] = numeros
  if (granos.length > 0) grouped['Granos (Lijas)'] = granos
  if (dimensiones.length > 0) grouped['Dimensiones'] = dimensiones
  if (otros.length > 0) grouped['Otros'] = otros
  
  return grouped
}

/**
 * Componente de filtros mejorado con pills mobile-first
 * - Pills horizontales con scroll para cada sección
 * - Diseño mobile-first con touch targets de 44px
 * - Sin accordions, todas las secciones visibles
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

  // Agrupar medidas para mostrar por tipo
  const groupedMeasures = React.useMemo(() => {
    if (sizeOptions.length === 0) return {}
    return groupMeasures(sizeOptions)
  }, [sizeOptions])

  // Determinar qué secciones deben estar abiertas por defecto (si tienen filtros activos)
  const defaultOpenSections = React.useMemo(() => {
    const open: string[] = []
    if (selectedSizes.length > 0) open.push('medidas')
    if (selectedColors.length > 0) open.push('colores')
    if (selectedBrands.length > 0) open.push('marcas')
    if (selectedPriceRanges && selectedPriceRanges.length > 0) open.push('precio')
    if (freeShippingOnly) open.push('envio')
    return open
  }, [selectedSizes.length, selectedColors.length, selectedBrands.length, selectedPriceRanges?.length, freeShippingOnly])

  if (isHorizontal) {
    // ✅ FIX: Layout mobile-first - vertical en mobile, horizontal en desktop
    // Fondo transparente/semi-transparente para tema oscuro
    return (
      <div className='bg-white/10 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 sm:px-4 md:px-4 mb-4 sm:mb-6 border border-white/20'>
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

        {/* Categorías */}
        <div className='mb-3'>
          <CategoryTogglePills
            selectedCategories={selectedCategories}
            onCategoryChange={onCategoryChange}
            variant='bare'
          />
        </div>

        {/* Secciones de filtros con pills - Layout colapsable compacto */}
        <Accordion type='multiple' defaultValue={defaultOpenSections} className='w-full'>
          {/* Medidas */}
          {sizeOptions.length > 0 && (
            <AccordionItem value='medidas' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
                Medidas {selectedSizes.length > 0 && <span className='text-white/70 ml-1'>({selectedSizes.length})</span>}
              </AccordionTrigger>
              <AccordionContent className='pt-1 pb-2'>
                <div className='max-h-[200px] overflow-y-auto pr-2'>
                  <SizeFilterPills
                    options={sizeOptions}
                    selected={selectedSizes}
                    onChange={onSizesChange}
                    groupedBy={Object.keys(groupedMeasures).length > 0 ? groupedMeasures : undefined}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Colores */}
          {colorOptions && colorOptions.length > 0 && (
            <AccordionItem value='colores' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
                Colores {selectedColors.length > 0 && <span className='text-white/70 ml-1'>({selectedColors.length})</span>}
              </AccordionTrigger>
              <AccordionContent className='pt-1 pb-2'>
                <div className='max-h-[150px] overflow-y-auto pr-2'>
                  <ColorFilterPills
                    options={colorOptions}
                    selected={selectedColors}
                    onChange={onColorsChange}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Marcas */}
          {brands.length > 0 && (
            <AccordionItem value='marcas' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
                Marcas {selectedBrands.length > 0 && <span className='text-white/70 ml-1'>({selectedBrands.length})</span>}
              </AccordionTrigger>
              <AccordionContent className='pt-1 pb-2'>
                <div className='max-h-[150px] overflow-y-auto pr-2'>
                  <BrandFilterPills
                    options={brands}
                    selected={selectedBrands}
                    onChange={onBrandsChange}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Precio */}
          {onPriceRangesChange && priceRanges.length > 0 && (
            <AccordionItem value='precio' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
                Precio {selectedPriceRanges && selectedPriceRanges.length > 0 && <span className='text-white/70 ml-1'>({selectedPriceRanges.length})</span>}
              </AccordionTrigger>
              <AccordionContent className='pt-1 pb-2'>
                <PriceRangeFilterPills
                  options={priceRanges}
                  selected={selectedPriceRanges || []}
                  onChange={onPriceRangesChange}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Envío Gratis */}
          {onFreeShippingChange && (
            <AccordionItem value='envio' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
                Envío
              </AccordionTrigger>
              <AccordionContent className='pt-1 pb-2'>
                <FreeShippingPill
                  enabled={freeShippingOnly}
                  onChange={onFreeShippingChange}
                />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    )
  }

  // Layout sidebar (vertical) - mismo diseño que horizontal pero en sidebar
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

      {/* Categorías */}
      <div className='mb-3'>
        <CategoryTogglePills
          selectedCategories={selectedCategories}
          onCategoryChange={onCategoryChange}
          variant='default'
        />
      </div>

      {/* Secciones de filtros con pills - Layout colapsable compacto */}
      <Accordion type='multiple' defaultValue={defaultOpenSections} className='w-full'>
        {/* Medidas */}
        {sizeOptions.length > 0 && (
          <AccordionItem value='medidas' className='border-none'>
            <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
              Medidas {selectedSizes.length > 0 && <span className='text-white/70 ml-1'>({selectedSizes.length})</span>}
            </AccordionTrigger>
            <AccordionContent className='pt-1 pb-2'>
              <div className='max-h-[200px] overflow-y-auto pr-2'>
                <SizeFilterPills
                  options={sizeOptions}
                  selected={selectedSizes}
                  onChange={onSizesChange}
                  groupedBy={Object.keys(groupedMeasures).length > 0 ? groupedMeasures : undefined}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Colores */}
        {colorOptions && colorOptions.length > 0 && (
          <AccordionItem value='colores' className='border-none'>
            <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
              Colores {selectedColors.length > 0 && <span className='text-white/70 ml-1'>({selectedColors.length})</span>}
            </AccordionTrigger>
            <AccordionContent className='pt-1 pb-2'>
              <div className='max-h-[150px] overflow-y-auto pr-2'>
                <ColorFilterPills
                  options={colorOptions}
                  selected={selectedColors}
                  onChange={onColorsChange}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Marcas */}
        {brands.length > 0 && (
          <AccordionItem value='marcas' className='border-none'>
            <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
              Marcas {selectedBrands.length > 0 && <span className='text-white/70 ml-1'>({selectedBrands.length})</span>}
            </AccordionTrigger>
            <AccordionContent className='pt-1 pb-2'>
              <div className='max-h-[150px] overflow-y-auto pr-2'>
                <BrandFilterPills
                  options={brands}
                  selected={selectedBrands}
                  onChange={onBrandsChange}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Precio */}
        {onPriceRangesChange && priceRanges.length > 0 && (
          <AccordionItem value='precio' className='border-none'>
            <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
              Precio {selectedPriceRanges && selectedPriceRanges.length > 0 && <span className='text-white/70 ml-1'>({selectedPriceRanges.length})</span>}
            </AccordionTrigger>
            <AccordionContent className='pt-1 pb-2'>
              <PriceRangeFilterPills
                options={priceRanges}
                selected={selectedPriceRanges || []}
                onChange={onPriceRangesChange}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Envío Gratis */}
        {onFreeShippingChange && (
          <AccordionItem value='envio' className='border-none'>
            <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline text-white'>
              Envío
            </AccordionTrigger>
            <AccordionContent className='pt-1 pb-2'>
              <FreeShippingPill
                enabled={freeShippingOnly}
                onChange={onFreeShippingChange}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

export default ImprovedFilters

