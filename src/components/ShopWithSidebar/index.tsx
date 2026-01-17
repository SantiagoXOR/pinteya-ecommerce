"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
// Importaciones de componentes legacy de filtros eliminadas en favor de UnifiedFilters
// import CategoryTogglePills from '@/components/Home/CategoryTogglePills'
// import { SizeTogglePills } from './SizeTogglePills'
// import { ColorTogglePills } from './ColorTogglePills'
// import { BrandTogglePills } from './BrandTogglePills'
import ImprovedFilters from '@/components/filters/ImprovedFilters'
import { useProducts } from '@/hooks/useProducts'
import { useCategoriesForFilters } from '@/hooks/useCategoriesWithDynamicCounts'
import { SHOP_CONSTANTS } from '@/constants/shop'
import SingleGridItem from '../Shop/SingleGridItem'
import SingleListItem from '../Shop/SingleListItem'
import { extractCapacityFromName } from '@/utils/product-utils'
import { buildFilterBadgesFromProducts } from '@/utils/filter-utils'

const ShopWithSidebar = () => {
  const [productStyle, setProductStyle] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCategoriesPills, setSelectedCategoriesPills] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
  const [freeShippingOnly, setFreeShippingOnly] = useState<boolean>(false)
  const [volumeMin, setVolumeMin] = useState<number | undefined>(undefined)
  const [volumeMax, setVolumeMax] = useState<number | undefined>(undefined)
  const [colorsExpanded, setColorsExpanded] = useState<boolean>(false)
  const VOLUME_PRESETS = ['1 Litro', '4 L', '10 L', '20 L']

  // Hook para obtener productos dinámicos
  const {
    products,
    loading,
    error,
    pagination,
    changePage,
    updateFilters,
    filterByCategories,
    filterByBrands,
    filterByPriceRange,
  } = useProducts({
    initialFilters: {
      limit: SHOP_CONSTANTS.PRODUCTS_PER_PAGE_SIDEBAR,
      // Orden por defecto: productos más caros primero
      sortBy: 'price',
      sortOrder: 'desc',
    },
  })

  // Hook para obtener categorías dinámicas
  const {
    categories: dynamicCategories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategoriesForFilters()

  // Sticky menu eliminado en la UI simplificada

  // Se elimina el ordenamiento por secciones (recientes/más vendidos) para simplificar la UI

  // Usar categorías dinámicas o fallback a categorías vacías mientras cargan
  const categories = categoriesLoading ? [] : dynamicCategories

  // Manejar selección de categoría
  const handleCategorySelect = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      // Si ya está seleccionada, deseleccionar
      setSelectedCategory('')
      setSelectedCategoriesPills([])
      // Usamos selección múltiple (vacía) para limpiar y evitar conflicto con category
      filterByCategories([])
    } else {
      // Seleccionar nueva categoría (sincronizamos con pills)
      setSelectedCategory(categorySlug)
      setSelectedCategoriesPills([categorySlug])
      // Aplicamos filtro múltiple para mantener una sola fuente de verdad
      filterByCategories([categorySlug])
    }
  }

  // Manejar cambio desde CategoryTogglePills (selección múltiple -> aplicamos última seleccionada)
  const handleCategoryPillsChange = (categories: string[]) => {
    setSelectedCategoriesPills(categories)
    if (categories.length === 0) {
      setSelectedCategory('')
      filterByCategories([])
    } else {
      // Mantener la UI mostrando la última seleccionada, pero aplicar todas
      const lastSelected = categories[categories.length - 1]
      setSelectedCategory(lastSelected || '')
      filterByCategories(categories)
    }
  }

  // Se elimina búsqueda y rango de precios (presentes en el header)

  // Tipos de productos eliminados; no usados en la UI actual

  // Listener de scroll eliminado

  // Manejo de sidebar eliminado; el sidebar es estático en desktop

  const clearAll = () => {
    setSelectedCategory('')
    setSelectedCategoriesPills([])
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedBrands([])
    setSelectedPriceRanges([])
    setFreeShippingOnly(false)
    setVolumeMin(undefined)
    setVolumeMax(undefined)
    setColorsExpanded(false)
    filterByCategories([])
    // ✅ FIX: Reiniciar filtros incluyendo priceMin, priceMax y asegurar orden por precio descendente
    filterByPriceRange(undefined, undefined)
    updateFilters({ sizes: [], colors: [], brands: [], priceMin: undefined, priceMax: undefined, sortBy: 'price', sortOrder: 'desc', page: 1 })
  }

  // Derivar medidas (capacidad/medida) desde productos y variantes usando lógica de badges
  const derivedSizes = useMemo(() => {
    const { measures } = buildFilterBadgesFromProducts(products)
    return measures
  }, [products])

  // Opciones de medidas para UI: solo derivadas (sin fallback estático)
  const sizeOptions = useMemo(() => {
    // Fallback de desarrollo: si no hay datos derivados, usar presets
    return derivedSizes && derivedSizes.length ? derivedSizes : VOLUME_PRESETS
  }, [derivedSizes])

  // Parse helpers: medidas -> litros
  const parseVolumeToLiters = (input: string): number | null => {
    if (!input) return null
    const s = input.trim().toLowerCase()
    // Ejemplos soportados: "20 l", "20l", "20 litros", "750 ml", "0.75 l", "1 lt", "1 lts"
    const mlMatch = s.match(/([0-9]*\.?[0-9]+)\s*ml\b/)
    if (mlMatch) {
      const val = Number(mlMatch[1])
      return isNaN(val) ? null : val / 1000
    }
    const lMatch = s.match(/([0-9]*\.?[0-9]+)\s*(l|lt|lts|litro|litros)\b/)
    if (lMatch) {
      const val = Number(lMatch[1])
      return isNaN(val) ? null : val
    }
    // Formatos compactos sin espacio: "20l"
    const compactL = s.match(/([0-9]*\.?[0-9]+)l\b/)
    if (compactL) {
      const val = Number(compactL[1])
      return isNaN(val) ? null : val
    }
    return null
  }

  // Conectar inputs Min/Max a filtros "sizes" mediante mapeo por rango
  useEffect(() => {
    const hasAny = typeof volumeMin === 'number' || typeof volumeMax === 'number'
    if (!hasAny) return

    const withinRange = derivedSizes.filter(measure => {
      const liters = parseVolumeToLiters(measure)
      if (liters === null) return false
      if (typeof volumeMin === 'number' && liters < volumeMin) return false
      if (typeof volumeMax === 'number' && liters > volumeMax) return false
      return true
    })

    setSelectedSizes(withinRange)
    updateFilters({ sizes: withinRange, page: 1 })
  }, [volumeMin, volumeMax, derivedSizes])

  const derivedColorObjects = useMemo(() => {
    const { colors } = buildFilterBadgesFromProducts(products)
    return colors
  }, [products])

  // Lista de marcas dinámicas desde productos
  const brandsList = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(products.map(p => p.brand).filter(Boolean) as string[])
    ).sort()
    
    return uniqueBrands.map((brand) => ({
      name: brand,
      slug: brand.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, 'mas-'),
    }))
  }, [products])

  // ✅ FIX: Función helper para convertir rangos de precio a priceMin/priceMax
  const parsePriceRanges = useCallback((ranges: string[]) => {
    if (ranges.length === 0) {
      return { priceMin: undefined, priceMax: undefined }
    }

    // Si hay múltiples rangos, usar el mínimo y máximo de todos
    let minPrice: number | undefined = undefined
    let maxPrice: number | undefined = undefined

    ranges.forEach(range => {
      if (range === 'Menos de $10.000') {
        maxPrice = maxPrice === undefined ? 10000 : Math.min(maxPrice, 10000)
      } else if (range === '$10.000 - $25.000') {
        minPrice = minPrice === undefined ? 10000 : Math.min(minPrice, 10000)
        maxPrice = maxPrice === undefined ? 25000 : Math.max(maxPrice, 25000)
      } else if (range === '$25.000 - $50.000') {
        minPrice = minPrice === undefined ? 25000 : Math.min(minPrice, 25000)
        maxPrice = maxPrice === undefined ? 50000 : Math.max(maxPrice, 50000)
      } else if (range === '$50.000 - $100.000') {
        minPrice = minPrice === undefined ? 50000 : Math.min(minPrice, 50000)
        maxPrice = maxPrice === undefined ? 100000 : Math.max(maxPrice, 100000)
      } else if (range === 'Más de $100.000') {
        minPrice = minPrice === undefined ? 100000 : Math.max(minPrice, 100000)
      }
    })

    return { priceMin: minPrice, priceMax: maxPrice }
  }, [])

  // Se eliminan rangos dinámicos de precio

  // UI de filtros unificada (reutilizable en sidebar y barra móvil)

  return (
    <>
      <section className='overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28'>
        <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
          <div className='flex gap-7.5'>
            {/* <!-- Sidebar oculto: mostramos filtros arriba como en mobile --> */}
            <div className='hidden'>
              <ImprovedFilters
                variant='sidebar'
                selectedCategories={selectedCategoriesPills}
                onCategoryChange={handleCategoryPillsChange}
                sizeOptions={sizeOptions}
                selectedSizes={selectedSizes}
                onSizesChange={(sizes) => {
                  setSelectedSizes(sizes)
                  updateFilters({ sizes })
                }}
                colorOptions={derivedColorObjects.length > 0 ? derivedColorObjects.slice(0, 20) : []}
                selectedColors={selectedColors}
                onColorsChange={(colors) => {
                  setSelectedColors(colors)
                  updateFilters({ colors })
                }}
                brands={brandsList}
                selectedBrands={selectedBrands}
                onBrandsChange={(brands) => {
                  setSelectedBrands(brands)
                  updateFilters({ brands })
                }}
                selectedPriceRanges={selectedPriceRanges}
                onPriceRangesChange={(ranges) => {
                  setSelectedPriceRanges(ranges)
                  // ✅ FIX: Convertir rangos a priceMin/priceMax y aplicar filtro
                  const { priceMin, priceMax } = parsePriceRanges(ranges)
                  filterByPriceRange(priceMin, priceMax)
                }}
                freeShippingOnly={freeShippingOnly}
                onFreeShippingChange={(enabled) => {
                  setFreeShippingOnly(enabled)
                  // ✅ FIX: Filtrar productos con precio >= $50.000 para envío gratis
                  if (enabled) {
                    filterByPriceRange(50000, undefined)
                  } else {
                    // Si se desactiva, restaurar filtros de precio si existen
                    if (selectedPriceRanges.length > 0) {
                      const { priceMin, priceMax } = parsePriceRanges(selectedPriceRanges)
                      filterByPriceRange(priceMin, priceMax)
                    } else {
                      filterByPriceRange(undefined, undefined)
                    }
                  }
                }}
                onClearAll={clearAll}
              />
            </div>
            {/* // <!-- Sidebar End --> */}

            {/* // <!-- Content Start --> */}
            <div className='w-full'>
              {/* Filtros barra horizontal en todas las resoluciones */}
              <div className='mb-4'>
                <ImprovedFilters
                  variant='horizontal'
                  selectedCategories={selectedCategoriesPills}
                  onCategoryChange={handleCategoryPillsChange}
                  sizeOptions={sizeOptions}
                  selectedSizes={selectedSizes}
                  onSizesChange={(sizes) => {
                    setSelectedSizes(sizes)
                    updateFilters({ sizes })
                  }}
                  colorOptions={derivedColorObjects.length > 0 ? derivedColorObjects.slice(0, 20) : []}
                  selectedColors={selectedColors}
                  onColorsChange={(colors) => {
                    setSelectedColors(colors)
                    updateFilters({ colors })
                  }}
                  brands={brandsList}
                  selectedBrands={selectedBrands}
                  onBrandsChange={(brands) => {
                    setSelectedBrands(brands)
                    updateFilters({ brands })
                  }}
                  selectedPriceRanges={selectedPriceRanges}
                  onPriceRangesChange={(ranges) => {
                    setSelectedPriceRanges(ranges)
                    // ✅ FIX: Convertir rangos a priceMin/priceMax y aplicar filtro
                    const { priceMin, priceMax } = parsePriceRanges(ranges)
                    filterByPriceRange(priceMin, priceMax)
                  }}
                  freeShippingOnly={freeShippingOnly}
                  onFreeShippingChange={(enabled) => {
                    setFreeShippingOnly(enabled)
                    // ✅ FIX: Filtrar productos con precio >= $50.000 para envío gratis
                    if (enabled) {
                      filterByPriceRange(50000, undefined)
                    } else {
                      // Si se desactiva, restaurar filtros de precio si existen
                      if (selectedPriceRanges.length > 0) {
                        const { priceMin, priceMax } = parsePriceRanges(selectedPriceRanges)
                        filterByPriceRange(priceMin, priceMax)
                      } else {
                        filterByPriceRange(undefined, undefined)
                      }
                    }
                  }}
                  onClearAll={clearAll}
                />
              </div>
              <div className='hidden'>
                <div className='flex items-center justify-between'>
                  {/* <!-- top bar left --> */}
                  <div className='flex flex-wrap items-center gap-4'>
                    {/* Ordenamiento por Tabs removido para simplificar la UI */}

                    {/* Conteo movido al pie junto con la paginación */}

                  {/* Pills de medidas/colores duplicadas en desktop eliminadas (unificadas en UnifiedFilters) */}
                  </div>

                  {/* <!-- top bar right: oculto --> */}
                  <div className='hidden items-center gap-2.5'>
                    <button
                      onClick={() => setProductStyle('grid')}
                      aria-label='button for product grid tab'
                      className={`${
                        productStyle === 'grid'
                          ? 'bg-blue border-blue text-white'
                          : 'text-dark bg-gray-1 border-gray-3'
                      } flex items-center justify-center w-10.5 h-9 rounded-[5px] border ease-out duration-200 hover:bg-blue hover:border-blue hover:text-white`}
                    >
                      <svg
                        className='fill-current'
                        width='18'
                        height='18'
                        viewBox='0 0 18 18'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M4.836 1.3125C4.16215 1.31248 3.60022 1.31246 3.15414 1.37244C2.6833 1.43574 2.2582 1.57499 1.91659 1.91659C1.57499 2.2582 1.43574 2.6833 1.37244 3.15414C1.31246 3.60022 1.31248 4.16213 1.3125 4.83598V4.914C1.31248 5.58785 1.31246 6.14978 1.37244 6.59586C1.43574 7.06671 1.57499 7.49181 1.91659 7.83341C2.2582 8.17501 2.6833 8.31427 3.15414 8.37757C3.60022 8.43754 4.16213 8.43752 4.83598 8.4375H4.914C5.58785 8.43752 6.14978 8.43754 6.59586 8.37757C7.06671 8.31427 7.49181 8.17501 7.83341 7.83341C8.17501 7.49181 8.31427 7.06671 8.37757 6.59586C8.43754 6.14978 8.43752 5.58787 8.4375 4.91402V4.83601C8.43752 4.16216 8.43754 3.60022 8.37757 3.15414C8.31427 2.6833 8.17501 2.2582 7.83341 1.91659C7.49181 1.57499 7.06671 1.43574 6.59586 1.37244C6.14978 1.31246 5.58787 1.31248 4.91402 1.3125H4.836ZM2.71209 2.71209C2.80983 2.61435 2.95795 2.53394 3.30405 2.4874C3.66632 2.4387 4.15199 2.4375 4.875 2.4375C5.59801 2.4375 6.08368 2.4387 6.44596 2.4874C6.79205 2.53394 6.94018 2.61435 7.03791 2.71209C7.13565 2.80983 7.21607 2.95795 7.2626 3.30405C7.31131 3.66632 7.3125 4.15199 7.3125 4.875C7.3125 5.59801 7.31131 6.08368 7.2626 6.44596C7.21607 6.79205 7.13565 6.94018 7.03791 7.03791C6.94018 7.13565 6.79205 7.21607 6.44596 7.2626C6.08368 7.31131 5.59801 7.3125 4.875 7.3125C4.15199 7.3125 3.66632 7.31131 3.30405 7.2626C2.95795 7.21607 2.80983 7.13565 2.71209 7.03791C2.61435 6.94018 2.53394 6.79205 2.4874 6.44596C2.4387 6.08368 2.4375 5.59801 2.4375 4.875C2.4375 4.15199 2.4387 3.66632 2.4874 3.30405C2.53394 2.95795 2.61435 2.80983 2.71209 2.71209Z'
                          fill=''
                        />
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M13.086 9.5625C12.4121 9.56248 11.8502 9.56246 11.4041 9.62244C10.9333 9.68574 10.5082 9.82499 10.1666 10.1666C9.82499 10.5082 9.68574 10.9333 9.62244 11.4041C9.56246 11.8502 9.56248 12.4121 9.5625 13.086V13.164C9.56248 13.8379 9.56246 14.3998 9.62244 14.8459C9.68574 15.3167 9.82499 15.7418 10.1666 16.0834C10.5082 16.425 10.9333 16.5643 11.4041 16.6276C11.8502 16.6875 12.4121 16.6875 13.0859 16.6875H13.164C13.8378 16.6875 14.3998 16.6875 14.8459 16.6276C15.3167 16.5643 15.7418 16.425 16.0834 16.0834C16.425 15.7418 16.5643 15.3167 16.6276 14.8459C16.6875 14.3998 16.6875 13.8379 16.6875 13.1641V13.086C16.6875 12.4122 16.6875 11.8502 16.6276 11.4041C16.5643 10.9333 16.425 10.5082 16.0834 10.1666C15.7418 9.82499 15.3167 9.68574 14.8459 9.62244C14.3998 9.56246 13.8379 9.56248 13.164 9.5625H13.086ZM10.9621 10.9621C11.0598 10.8644 11.208 10.7839 11.554 10.7374C11.9163 10.6887 12.402 10.6875 13.125 10.6875C13.848 10.6875 14.3337 10.6887 14.696 10.7374C15.0421 10.7839 15.1902 10.8644 15.2879 10.9621C15.3857 11.0598 15.4661 11.208 15.5126 11.554C15.5613 11.9163 15.5625 12.402 15.5625 13.125C15.5625 13.848 15.5613 14.3337 15.5126 14.696C15.4661 15.0421 15.3857 15.1902 15.2879 15.2879C15.1902 15.3857 15.0421 15.4661 14.696 15.5126C14.3337 15.5613 13.848 15.5625 13.125 15.5625C12.402 15.5625 11.9163 15.5613 11.554 15.5126C11.208 15.4661 11.0598 15.3857 10.9621 15.2879C10.8644 15.1902 10.7839 15.0421 10.7374 14.696C10.6887 14.3337 10.6875 13.848 10.6875 13.125C10.6875 12.402 10.6887 11.9163 10.7374 11.554C10.7839 11.208 10.8644 11.0598 10.9621 10.9621Z'
                          fill=''
                        />
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M4.836 9.5625H4.914C5.58786 9.56248 6.14978 9.56246 6.59586 9.62244C7.06671 9.68574 7.49181 9.82499 7.83341 10.1666C8.17501 10.5082 8.31427 10.9333 8.37757 11.4041C8.43754 11.8502 8.43752 12.4121 8.4375 13.086V13.164C8.43752 13.8378 8.43754 14.3998 8.37757 14.8459C8.31427 15.3167 8.17501 15.7418 7.83341 16.0834C7.49181 16.425 7.06671 16.5643 6.59586 16.6276C6.14979 16.6875 5.58789 16.6875 4.91405 16.6875H4.83601C4.16217 16.6875 3.60022 16.6875 3.15414 16.6276C2.6833 16.5643 2.2582 16.425 1.91659 16.0834C1.57499 15.7418 1.43574 15.3167 1.37244 14.8459C1.31246 14.3998 1.31248 13.8379 1.3125 13.164V13.086C1.31248 12.4122 1.31246 11.8502 1.37244 11.4041C1.43574 10.9333 1.57499 10.5082 1.91659 10.1666C2.2582 9.82499 2.6833 9.68574 3.15414 9.62244C3.60023 9.56246 4.16214 9.56248 4.836 9.5625ZM3.30405 10.7374C2.95795 10.7839 2.80983 10.8644 2.71209 10.9621C2.61435 11.0598 2.53394 11.208 2.4874 11.554C2.4387 11.9163 2.4375 12.402 2.4375 13.125C2.4375 13.848 2.4387 14.3337 2.4874 14.696C2.53394 15.0421 2.61435 15.1902 2.71209 15.2879C2.80983 15.3857 2.95795 15.4661 3.30405 15.5126C3.66632 15.5613 4.15199 15.5625 4.875 15.5625C5.59801 15.5625 6.08368 15.5613 6.44596 15.5126C6.79205 15.4661 6.94018 15.3857 7.03791 15.2879C7.13565 15.1902 7.21607 15.0421 7.2626 14.696C7.31131 14.3337 7.3125 13.848 7.3125 13.125C7.3125 12.402 7.31131 11.9163 7.2626 11.554C7.21607 11.208 7.13565 11.0598 7.03791 10.9621C6.94018 10.8644 6.79205 10.7839 6.44596 10.7374C6.08368 10.6887 5.59801 10.6875 4.875 10.6875C4.15199 10.6875 3.66632 10.6887 3.30405 10.7374Z'
                          fill=''
                        />
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M13.086 1.3125C12.4122 1.31248 11.8502 1.31246 11.4041 1.37244C10.9333 1.43574 10.5082 1.57499 10.1666 1.91659C9.82499 2.2582 9.68574 2.6833 9.62244 3.15414C9.56246 3.60023 9.56248 4.16214 9.5625 4.836V4.914C9.56248 5.58786 9.56246 6.14978 9.62244 6.59586C9.68574 7.06671 9.82499 7.49181 10.1666 7.83341C10.5082 8.17501 10.9333 8.31427 11.4041 8.37757C11.8502 8.43754 12.4121 8.43752 13.086 8.4375H13.164C13.8378 8.43752 14.3998 8.43754 14.8459 8.37757C15.3167 8.31427 15.7418 8.17501 16.0834 7.83341C16.425 7.49181 16.5643 7.06671 16.6276 6.59586C16.6875 6.14978 16.6875 5.58787 16.6875 4.91402V4.83601C16.6875 4.16216 16.6875 3.60022 16.6276 3.15414C16.5643 2.6833 16.425 2.2582 16.0834 1.91659C15.7418 1.57499 15.3167 1.43574 14.8459 1.37244C14.3998 1.31246 13.8379 1.31248 13.164 1.3125H13.086ZM10.9621 2.71209C11.0598 2.61435 11.208 2.53394 11.554 2.4874C11.9163 2.4387 12.402 2.4375 13.125 2.4375C13.848 2.4375 14.3337 2.4387 14.696 2.4874C15.0421 2.53394 15.1902 2.61435 15.2879 2.71209C15.3857 2.80983 15.4661 2.95795 15.5126 3.30405C15.5613 3.66632 15.5625 4.15199 15.5625 4.875C15.5625 5.59801 15.5613 6.08368 15.5126 6.44596C15.4661 6.79205 15.3857 6.94018 15.2879 7.03791C15.1902 7.13565 15.0421 7.21607 14.696 7.2626C14.3337 7.31131 13.848 7.3125 13.125 7.3125C12.402 7.3125 11.9163 7.31131 11.554 7.2626C11.208 7.21607 11.0598 7.13565 10.9621 7.03791C10.8644 6.94018 10.7839 6.79205 10.7374 6.44596C10.6887 6.08368 10.6875 5.59801 10.6875 4.875C10.6875 4.15199 10.6887 3.66632 10.7374 3.30405C10.7839 2.95795 10.8644 2.80983 10.9621 2.71209Z'
                          fill=''
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => setProductStyle('list')}
                      aria-label='button for product list tab'
                      className={`${
                        productStyle === 'list'
                          ? 'bg-blue border-blue text-white'
                          : 'text-dark bg-gray-1 border-gray-3'
                      } flex items-center justify-center w-10.5 h-9 rounded-[5px] border ease-out duration-200 hover:bg-blue hover:border-blue hover:text-white`}
                    >
                      <svg
                        className='fill-current'
                        width='18'
                        height='18'
                        viewBox='0 0 18 18'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M4.4234 0.899903C3.74955 0.899882 3.18763 0.899864 2.74155 0.959838C2.2707 1.02314 1.8456 1.16239 1.504 1.504C1.16239 1.8456 1.02314 2.2707 0.959838 2.74155C0.899864 3.18763 0.899882 3.74953 0.899903 4.42338V4.5014C0.899882 5.17525 0.899864 5.73718 0.959838 6.18326C1.02314 6.65411 1.16239 7.07921 1.504 7.42081C1.8456 7.76241 2.2707 7.90167 2.74155 7.96497C3.18763 8.02495 3.74953 8.02493 4.42339 8.02491H4.5014C5.17525 8.02493 14.7372 8.02495 15.1833 7.96497C15.6541 7.90167 16.0792 7.76241 16.4208 7.42081C16.7624 7.07921 16.9017 6.65411 16.965 6.18326C17.0249 5.73718 17.0249 5.17527 17.0249 4.50142V4.42341C17.0249 3.74956 17.0249 3.18763 16.965 2.74155C16.9017 2.2707 16.7624 1.8456 16.4208 1.504C16.0792 1.16239 15.6541 1.02314 15.1833 0.959838C14.7372 0.899864 5.17528 0.899882 4.50142 0.899903H4.4234ZM2.29949 2.29949C2.39723 2.20175 2.54535 2.12134 2.89145 2.07481C3.25373 2.0261 3.7394 2.0249 4.4624 2.0249C5.18541 2.0249 14.6711 2.0261 15.0334 2.07481C15.3795 2.12134 15.5276 2.20175 15.6253 2.29949C15.7231 2.39723 15.8035 2.54535 15.85 2.89145C15.8987 3.25373 15.8999 3.7394 15.8999 4.4624C15.8999 5.18541 15.8987 5.67108 15.85 6.03336C15.8035 6.37946 15.7231 6.52758 15.6253 6.62532C15.5276 6.72305 15.3795 6.80347 15.0334 6.85C14.6711 6.89871 5.18541 6.8999 4.4624 6.8999C3.7394 6.8999 3.25373 6.89871 2.89145 6.85C2.54535 6.80347 2.39723 6.72305 2.29949 6.62532C2.20175 6.52758 2.12134 6.37946 2.07481 6.03336C2.0261 5.67108 2.0249 5.18541 2.0249 4.4624C2.0249 3.7394 2.0261 3.25373 2.07481 2.89145C2.12134 2.54535 2.20175 2.39723 2.29949 2.29949Z'
                          fill=''
                        />
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M4.4234 9.1499H4.5014C5.17526 9.14988 14.7372 9.14986 15.1833 9.20984C15.6541 9.27314 16.0792 9.41239 16.4208 9.754C16.7624 10.0956 16.9017 10.5207 16.965 10.9915C17.0249 11.4376 17.0249 11.9995 17.0249 12.6734V12.7514C17.0249 13.4253 17.0249 13.9872 16.965 14.4333C16.9017 14.9041 16.7624 15.3292 16.4208 15.6708C16.0792 16.0124 15.6541 16.1517 15.1833 16.215C14.7372 16.2749 5.17529 16.2749 4.50145 16.2749H4.42341C3.74957 16.2749 3.18762 16.2749 2.74155 16.215C2.2707 16.1517 1.8456 16.0124 1.504 15.6708C1.16239 15.3292 1.02314 14.9041 0.959838 14.4333C0.899864 13.9872 0.899882 13.4253 0.899903 12.7514V12.6734C0.899882 11.9996 0.899864 11.4376 0.959838 10.9915C1.02314 10.5207 1.16239 10.0956 1.504 9.754C1.8456 9.41239 2.2707 9.27314 2.74155 9.20984C3.18763 9.14986 3.74955 9.14988 4.4234 9.1499ZM2.89145 10.3248C2.54535 10.3713 2.39723 10.4518 2.29949 10.5495C2.20175 10.6472 2.12134 10.7954 2.07481 11.1414C2.0261 11.5037 2.0249 11.9894 2.0249 12.7124C2.0249 13.4354 2.0261 13.9211 2.07481 14.2834C2.12134 14.6295 2.20175 14.7776 2.29949 14.8753C2.39723 14.9731 2.54535 15.0535 2.89145 15.1C3.25373 15.1487 3.7394 15.1499 4.4624 15.1499C5.18541 15.1499 14.6711 15.1487 15.0334 15.1C15.3795 15.0535 15.5276 14.9731 15.6253 14.8753C15.7231 14.7776 15.8035 14.6295 15.85 14.2834C15.8987 13.9211 15.8999 13.4354 15.8999 12.7124C15.8999 11.9894 15.8987 11.5037 15.85 11.1414C15.8035 10.7954 15.7231 10.6472 15.6253 10.5495C15.5276 10.4518 15.3795 10.3713 15.0334 10.3248C14.6711 10.2761 5.18541 10.2749 4.4624 10.2749C3.7394 10.2749 3.25373 10.2761 2.89145 10.3248Z'
                          fill=''
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bloque de CategoryTogglePills duplicado en desktop eliminado (contenido unificado en UnifiedFilters) */}

              {/* <!-- Products Grid Tab Content Start --> */}
              {loading ? (
                <div className='flex items-center justify-center py-20'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue'></div>
                  <span className='ml-3 text-gray-600'>Cargando productos...</span>
                </div>
              ) : error ? (
                <div className='flex items-center justify-center py-20'>
                  <div className='text-center'>
                    <p className='text-red-500 mb-4'>
                      Error:{' '}
                      {typeof error === 'object' && error !== null && 'message' in error
                        ? (error as Error).message
                        : String(error) || 'Error desconocido'}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className='bg-blue text-white px-4 py-2 rounded hover:bg-blue-600'
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className='flex items-center justify-center py-20'>
                  <p className='text-gray-600'>No se encontraron productos.</p>
                </div>
              ) : (
                <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-x-7.5 md:gap-y-9'>
                  {products.map((item, key) => (
                    <SingleGridItem item={item} key={key} />
                  ))}
                </div>
              )}
              {/* <!-- Products Grid Tab Content End --> */}

              {/* <!-- Products Pagination Start --> */}
              {pagination.totalPages > 1 && (
                <div className='flex flex-col items-center gap-3 mt-15'>
                  <p className='text-sm'>
                    Mostrando{' '}
                    <span className='text-dark'>
                      {loading ? '...' : `${products.length} de ${pagination.total}`}
                    </span>{' '}
                    Productos
                  </p>
                  <div className='bg-white shadow-1 rounded-md p-2'>
                    <ul className='flex items-center'>
                    <li>
                      <button
                        id='paginationLeft'
                        aria-label='button for pagination left'
                        type='button'
                        disabled
                        className='flex items-center justify-center w-8 h-9 ease-out duration-200 rounded-[3px disabled:text-gray-4'
                      >
                        <svg
                          className='fill-current'
                          width='18'
                          height='18'
                          viewBox='0 0 18 18'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M12.1782 16.1156C12.0095 16.1156 11.8407 16.0594 11.7282 15.9187L5.37197 9.45C5.11885 9.19687 5.11885 8.80312 5.37197 8.55L11.7282 2.08125C11.9813 1.82812 12.3751 1.82812 12.6282 2.08125C12.8813 2.33437 12.8813 2.72812 12.6282 2.98125L6.72197 9L12.6563 15.0187C12.9095 15.2719 12.9095 15.6656 12.6563 15.9187C12.4876 16.0312 12.347 16.1156 12.1782 16.1156Z'
                            fill=''
                          />
                        </svg>
                      </button>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] bg-blue text-white hover:text-white hover:bg-blue'
                      >
                        1
                      </a>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue'
                      >
                        2
                      </a>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue'
                      >
                        3
                      </a>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue'
                      >
                        4
                      </a>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue'
                      >
                        5
                      </a>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue'
                      >
                        ...
                      </a>
                    </li>

                    <li>
                      <a
                        href='#'
                        className='flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue'
                      >
                        10
                      </a>
                    </li>

                    <li>
                      <button
                        id='paginationLeft'
                        aria-label='button for pagination left'
                        type='button'
                        className='flex items-center justify-center w-8 h-9 ease-out duration-200 rounded-[3px] hover:text-white hover:bg-blue disabled:text-gray-4'
                      >
                        <svg
                          className='fill-current'
                          width='18'
                          height='18'
                          viewBox='0 0 18 18'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M5.82197 16.1156C5.65322 16.1156 5.5126 16.0594 5.37197 15.9469C5.11885 15.6937 5.11885 15.3 5.37197 15.0469L11.2782 9L5.37197 2.98125C5.11885 2.72812 5.11885 2.33437 5.37197 2.08125C5.6251 1.82812 6.01885 1.82812 6.27197 2.08125L12.6282 8.55C12.8813 8.80312 12.8813 9.19687 12.6282 9.45L6.27197 15.9187C6.15947 16.0312 5.99072 16.1156 5.82197 16.1156Z'
                            fill=''
                          />
                        </svg>
                      </button>
                    </li>
                    </ul>
                  </div>
                </div>
              )}
              {/* <!-- Products Pagination End --> */}
            </div>
            {/* // <!-- Content End --> */}
          </div>
        </div>
      </section>
    </>
  )
}

export default ShopWithSidebar
