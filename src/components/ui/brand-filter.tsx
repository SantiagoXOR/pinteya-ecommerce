// ===================================
// COMPONENTE: Filtro de Marcas
// ===================================

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Search, X } from 'lucide-react'
import { getBrandColor, formatBrandName } from '@/lib/api/brands'

// ===================================
// TIPOS
// ===================================

export interface Brand {
  name: string
  products_count: number
}

export interface BrandFilterProps {
  brands: Brand[]
  selectedBrands: string[]
  onBrandChange: (brands: string[]) => void
  isLoading?: boolean
  showSearch?: boolean
  showProductCount?: boolean
  maxHeight?: string
  className?: string
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export function BrandFilter({
  brands,
  selectedBrands,
  onBrandChange,
  isLoading = false,
  showSearch = true,
  showProductCount = true,
  maxHeight = '300px',
  className = '',
}: BrandFilterProps) {
  const [searchTerm, setSearchTerm] = React.useState('')

  // Filtrar marcas por término de búsqueda
  const filteredBrands = React.useMemo(() => {
    if (!searchTerm) {
      return brands
    }
    return brands.filter(brand => brand.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [brands, searchTerm])

  // Manejar selección de marca
  const handleBrandToggle = (brandName: string) => {
    const newSelectedBrands = selectedBrands.includes(brandName)
      ? selectedBrands.filter(b => b !== brandName)
      : [...selectedBrands, brandName]

    onBrandChange(newSelectedBrands)
  }

  // Limpiar filtros
  const handleClearAll = () => {
    onBrandChange([])
  }

  // Seleccionar todas las marcas visibles
  const handleSelectAll = () => {
    const allVisibleBrands = filteredBrands.map(b => b.name)
    onBrandChange(allVisibleBrands)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='text-sm'>Marcas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex items-center space-x-2'>
                <div className='w-4 h-4 bg-gray-200 rounded animate-pulse' />
                <div className='h-4 bg-gray-200 rounded flex-1 animate-pulse' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm'>Marcas</CardTitle>
          {selectedBrands.length > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {selectedBrands.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Búsqueda */}
        {showSearch && (
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Buscar marcas...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-8 h-9'
            />
            {searchTerm && (
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-1 top-1 h-7 w-7 p-0'
                onClick={() => setSearchTerm('')}
              >
                <X className='h-3 w-3' />
              </Button>
            )}
          </div>
        )}

        {/* Controles */}
        {filteredBrands.length > 1 && (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSelectAll}
              className='text-xs h-7 px-2'
            >
              Todas
            </Button>
            {selectedBrands.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleClearAll}
                className='text-xs h-7 px-2'
              >
                Limpiar
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Lista de marcas */}
        <div style={{ maxHeight, overflowY: 'auto' }} className='pr-4'>
          <div className='space-y-3'>
            {filteredBrands.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No se encontraron marcas
              </p>
            ) : (
              filteredBrands.map(brand => (
                <div key={brand.name} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`brand-${brand.name}`}
                    checked={selectedBrands.includes(brand.name)}
                    onCheckedChange={() => handleBrandToggle(brand.name)}
                  />
                  <label
                    htmlFor={`brand-${brand.name}`}
                    className='flex-1 cursor-pointer flex items-center justify-between text-sm font-medium'
                  >
                    <span className='text-sm font-medium'>{formatBrandName(brand.name)}</span>
                    {showProductCount && (
                      <Badge
                        variant='outline'
                        className='text-xs ml-2'
                        style={{
                          borderColor: getBrandColor(brand.name),
                          color: getBrandColor(brand.name),
                        }}
                      >
                        {brand.products_count}
                      </Badge>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Marcas seleccionadas */}
        {selectedBrands.length > 0 && (
          <>
            <Separator />
            <div className='space-y-2'>
              <label className='text-xs font-medium text-muted-foreground'>Filtros activos:</label>
              <div className='flex flex-wrap gap-1'>
                {selectedBrands.map(brandName => (
                  <Badge
                    key={brandName}
                    variant='secondary'
                    className='text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground'
                    onClick={() => handleBrandToggle(brandName)}
                  >
                    {formatBrandName(brandName)}
                    <X className='ml-1 h-3 w-3' />
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ===================================
// COMPONENTE COMPACTO
// ===================================

export interface BrandFilterCompactProps {
  brands: Brand[]
  selectedBrands: string[]
  onBrandChange: (brands: string[]) => void
  className?: string
}

export function BrandFilterCompact({
  brands,
  selectedBrands,
  onBrandChange,
  className = '',
}: BrandFilterCompactProps) {
  const handleBrandToggle = (brandName: string) => {
    const newSelectedBrands = selectedBrands.includes(brandName)
      ? selectedBrands.filter(b => b !== brandName)
      : [...selectedBrands, brandName]

    onBrandChange(newSelectedBrands)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className='text-sm font-medium'>Marcas</label>
      <div className='flex flex-wrap gap-2'>
        {brands.map(brand => (
          <Badge
            key={brand.name}
            variant={selectedBrands.includes(brand.name) ? 'default' : 'outline'}
            className='cursor-pointer hover:bg-primary hover:text-primary-foreground'
            onClick={() => handleBrandToggle(brand.name)}
            style={
              selectedBrands.includes(brand.name)
                ? {
                    backgroundColor: getBrandColor(brand.name),
                    borderColor: getBrandColor(brand.name),
                  }
                : {
                    borderColor: getBrandColor(brand.name),
                    color: getBrandColor(brand.name),
                  }
            }
          >
            {formatBrandName(brand.name)}
            {selectedBrands.includes(brand.name) && <X className='ml-1 h-3 w-3' />}
          </Badge>
        ))}
      </div>
    </div>
  )
}
