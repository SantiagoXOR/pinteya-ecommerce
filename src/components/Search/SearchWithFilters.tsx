'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategoriesForFilters } from '@/hooks/useCategoriesWithDynamicCounts'
import ImprovedFilters from '@/components/filters/ImprovedFilters'
import { buildFilterBadgesFromProducts } from '@/utils/filter-utils'
import type { ProductFilters } from '@/types/api'
import { ExtendedProduct } from '@/lib/adapters/productAdapter'

const VOLUME_PRESETS = ['1 Litro', '4 L', '10 L', '20 L']

const parsePriceRanges = (ranges: string[]) => {
  if (ranges.length === 0) return { priceMin: undefined, priceMax: undefined }
  let minPrice: number | undefined
  let maxPrice: number | undefined
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
}

export interface SearchWithFiltersProps {
  searchQuery: string
  children: (props: {
    products: ExtendedProduct[]
    loading: boolean
    error: string | null
    totalResults: number
    filtersBar: React.ReactNode
    clearAll: () => void
  }) => React.ReactNode
}

export function SearchWithFilters({ searchQuery, children }: SearchWithFiltersProps) {
  const [selectedCategoriesPills, setSelectedCategoriesPills] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
  const [freeShippingOnly, setFreeShippingOnly] = useState(false)

  const {
    products,
    loading,
    error,
    pagination,
    updateFilters,
    filterByCategories,
    filterByPriceRange,
  } = useProducts({
    initialFilters: {
      search: searchQuery.trim() || undefined,
      limit: 50,
      page: 1,
      sortBy: 'price',
      sortOrder: 'asc',
    },
    autoFetch: true,
  })

  useEffect(() => {
    if (searchQuery.trim()) {
      updateFilters({ search: searchQuery.trim(), page: 1 })
    }
  }, [searchQuery])

  const { categories: dynamicCategories, loading: categoriesLoading } = useCategoriesForFilters()
  const categories = categoriesLoading ? [] : dynamicCategories

  const derivedSizes = useMemo(() => {
    const { measures } = buildFilterBadgesFromProducts(products)
    return measures
  }, [products])

  const sizeOptions = useMemo(
    () => (derivedSizes?.length ? derivedSizes : VOLUME_PRESETS),
    [derivedSizes]
  )

  const derivedColorObjects = useMemo(() => {
    const { colors } = buildFilterBadgesFromProducts(products)
    return colors
  }, [products])

  const brandsList = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.brand).filter(Boolean) as string[])).sort()
    return unique.map(brand => ({
      name: brand,
      slug: brand.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, 'mas-'),
    }))
  }, [products])

  const clearAll = useCallback(() => {
    setSelectedCategoriesPills([])
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedBrands([])
    setSelectedPriceRanges([])
    setFreeShippingOnly(false)
    filterByCategories([])
    filterByPriceRange(undefined, undefined)
    updateFilters({
      sizes: [],
      colors: [],
      brands: [],
      priceMin: undefined,
      priceMax: undefined,
      search: searchQuery.trim() || undefined,
      page: 1,
    })
  }, [searchQuery, filterByCategories, filterByPriceRange, updateFilters])

  const filteredProducts = useMemo(() => {
    if (!products?.length) return []
    let result = [...products]
    if (selectedSizes.length > 0) {
      result = result.filter(p => {
        if (p.variants?.length) {
          return p.variants.some((v: any) =>
            selectedSizes.some(
              s =>
                (v.measure || '').replace(/\s+/g, '').toUpperCase() ===
                  s.replace(/\s+/g, '').toUpperCase() ||
                (v.measure || '').includes(s)
            )
          )
        }
        return selectedSizes.some(
          s =>
            (p.medida || '').replace(/\s+/g, '').toUpperCase() === s.replace(/\s+/g, '').toUpperCase()
        )
      })
    }
    if (selectedColors.length > 0) {
      result = result.filter(p => {
        if (p.variants?.length) {
          return p.variants.some((v: any) =>
            selectedColors.some(
              c =>
                (v.color_name || '').trim().toUpperCase() === c.trim().toUpperCase() ||
                (v.color_name || '').toLowerCase().includes(c.toLowerCase())
            )
          )
        }
        return selectedColors.some(
          c =>
            (p.color || '').trim().toUpperCase() === c.trim().toUpperCase() ||
            (p.color || '').toLowerCase().includes(c.toLowerCase())
        )
      })
    }
    // Brands and categories filtered by API via updateFilters
    return result
  }, [products, selectedSizes, selectedColors, selectedBrands, brandsList])

  const filtersBar = (
    <div className='mb-4'>
      <ImprovedFilters
        variant='horizontal'
        selectedCategories={selectedCategoriesPills}
        onCategoryChange={cats => {
          setSelectedCategoriesPills(cats)
          filterByCategories(cats)
        }}
        sizeOptions={sizeOptions}
        selectedSizes={selectedSizes}
        onSizesChange={s => setSelectedSizes(s)}
        colorOptions={derivedColorObjects?.slice(0, 20) || []}
        selectedColors={selectedColors}
        onColorsChange={c => setSelectedColors(c)}
        brands={brandsList}
        selectedBrands={selectedBrands}
        onBrandsChange={slugs => {
          setSelectedBrands(slugs)
          const names = slugs.map(slug => brandsList.find(b => b.slug === slug)?.name ?? slug)
          updateFilters({ brands: names, page: 1 })
        }}
        selectedPriceRanges={selectedPriceRanges}
        onPriceRangesChange={ranges => {
          setSelectedPriceRanges(ranges)
          const { priceMin, priceMax } = parsePriceRanges(ranges)
          filterByPriceRange(priceMin, priceMax)
        }}
        freeShippingOnly={freeShippingOnly}
        onFreeShippingChange={enabled => {
          setFreeShippingOnly(enabled)
          filterByPriceRange(enabled ? 50000 : undefined, undefined)
        }}
        onClearAll={clearAll}
      />
    </div>
  )

  return (
    <>
      {children({
        products: filteredProducts,
        loading,
        error,
        totalResults: pagination.total,
        filtersBar,
        clearAll,
      })}
    </>
  )
}
