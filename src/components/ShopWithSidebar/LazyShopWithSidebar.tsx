// ===================================
// PINTEYA E-COMMERCE - LAZY SHOP WITH SIDEBAR
// Wrapper con lazy loading para ShopWithSidebar (29.20KB)
// ===================================

'use client'

import React, { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  Star,
  Heart,
  ShoppingCart,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from '@/lib/optimized-imports'

// Lazy loading del componente principal
const ShopWithSidebar = lazy(() => import('./index'))

// ===================================
// SKELETON COMPONENTS
// ===================================

const FilterSkeleton = ({ title }: { title: string }) => (
  <div className='space-y-3'>
    <div className='flex items-center justify-between'>
      <Skeleton className='h-5 w-20' />
      <ChevronDown className='w-4 h-4 text-gray-400' />
    </div>
    <div className='space-y-2'>
      {[...Array(4)].map((_, i) => (
        <div key={i} className='flex items-center space-x-2'>
          <Skeleton className='w-4 h-4 rounded' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-6 ml-auto' />
        </div>
      ))}
    </div>
  </div>
)

const ProductCardSkeleton = () => (
  <Card className='group hover:shadow-lg transition-shadow duration-300'>
    <CardContent className='p-0'>
      {/* Product Image */}
      <div className='relative overflow-hidden rounded-t-lg'>
        <Skeleton className='w-full h-64 bg-gray-200' />

        {/* Overlay actions */}
        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center'>
          <div className='flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <Button size='sm' variant='secondary' className='rounded-full' disabled>
              <Heart className='w-4 h-4' />
            </Button>
            <Button size='sm' variant='secondary' className='rounded-full' disabled>
              <ShoppingCart className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Badge */}
        <div className='absolute top-2 left-2'>
          <Badge variant='secondary'>
            <Skeleton className='h-3 w-8' />
          </Badge>
        </div>
      </div>

      {/* Product Info */}
      <div className='p-4 space-y-3'>
        {/* Title */}
        <Skeleton className='h-5 w-full' />

        {/* Rating */}
        <div className='flex items-center space-x-1'>
          {[...Array(5)].map((_, i) => (
            <Star key={i} className='w-4 h-4 text-gray-300' />
          ))}
          <Skeleton className='h-4 w-8 ml-2' />
        </div>

        {/* Price */}
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-6 w-16' />
          <Skeleton className='h-4 w-12' />
        </div>

        {/* Colors */}
        <div className='flex space-x-1'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='w-6 h-6 rounded-full' />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

const ProductListItemSkeleton = () => (
  <Card className='group hover:shadow-lg transition-shadow duration-300'>
    <CardContent className='p-0'>
      <div className='flex'>
        {/* Product Image */}
        <div className='relative w-48 h-48 flex-shrink-0'>
          <Skeleton className='w-full h-full bg-gray-200' />

          {/* Badge */}
          <div className='absolute top-2 left-2'>
            <Badge variant='secondary'>
              <Skeleton className='h-3 w-8' />
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className='flex-1 p-6 space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-2/3' />
          </div>

          {/* Rating */}
          <div className='flex items-center space-x-1'>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className='w-4 h-4 text-gray-300' />
            ))}
            <Skeleton className='h-4 w-8 ml-2' />
          </div>

          {/* Price */}
          <div className='flex items-center space-x-2'>
            <Skeleton className='h-7 w-20' />
            <Skeleton className='h-5 w-16' />
          </div>

          {/* Colors and Actions */}
          <div className='flex items-center justify-between'>
            <div className='flex space-x-1'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='w-6 h-6 rounded-full' />
              ))}
            </div>

            <div className='flex space-x-2'>
              <Button size='sm' variant='outline' disabled>
                <Heart className='w-4 h-4 mr-2' />
                <Skeleton className='h-4 w-12' />
              </Button>
              <Button size='sm' disabled>
                <ShoppingCart className='w-4 h-4 mr-2' />
                <Skeleton className='h-4 w-16' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const ShopWithSidebarSkeleton = () => {
  const [viewMode, setViewMode] = React.useState('grid')

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Breadcrumb skeleton */}
      <div className='container mx-auto px-4 py-4'>
        <div className='flex items-center space-x-2 mb-6'>
          <Skeleton className='h-4 w-12' />
          <span className='text-gray-400'>/</span>
          <Skeleton className='h-4 w-16' />
        </div>
      </div>

      <div className='container mx-auto px-4 pb-12'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar */}
          <div className='w-full lg:w-80 space-y-6'>
            {/* Mobile filter toggle */}
            <div className='lg:hidden'>
              <Button variant='outline' className='w-full' disabled>
                <SlidersHorizontal className='w-4 h-4 mr-2' />
                <Skeleton className='h-4 w-16' />
              </Button>
            </div>

            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Search className='w-5 h-5' />
                  <Skeleton className='h-5 w-16' />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='relative'>
                  <Input placeholder='Buscar productos...' disabled />
                  <Search className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Filter className='w-5 h-5' />
                  <Skeleton className='h-5 w-16' />
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <FilterSkeleton title='Categorías' />
                <FilterSkeleton title='Género' />
                <FilterSkeleton title='Tallas' />
                <FilterSkeleton title='Colores' />

                {/* Price Range */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-5 w-16' />
                    <ChevronDown className='w-4 h-4 text-gray-400' />
                  </div>
                  <div className='space-y-3'>
                    <div className='flex space-x-2'>
                      <Input placeholder='Min' disabled className='flex-1' />
                      <Input placeholder='Max' disabled className='flex-1' />
                    </div>
                    <Button variant='outline' size='sm' disabled className='w-full'>
                      <Skeleton className='h-4 w-16' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className='flex-1 space-y-6'>
            {/* Toolbar */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  {/* Results count */}
                  <div className='flex items-center space-x-2'>
                    <Skeleton className='h-5 w-32' />
                  </div>

                  {/* Controls */}
                  <div className='flex items-center space-x-4'>
                    {/* Sort dropdown */}
                    <div className='flex items-center space-x-2'>
                      <ArrowUpDown className='w-4 h-4 text-gray-500' />
                      <Button variant='outline' size='sm' disabled>
                        <Skeleton className='h-4 w-20' />
                        <ChevronDown className='w-4 h-4 ml-2' />
                      </Button>
                    </div>

                    {/* View toggle */}
                    <div className='flex border rounded-lg'>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('grid')}
                        className='rounded-r-none'
                      >
                        <Grid className='w-4 h-4' />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('list')}
                        className='rounded-l-none'
                      >
                        <List className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid/List */}
            <div className='space-y-6'>
              {viewMode === 'grid' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {[...Array(9)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className='space-y-4'>
                  {[...Array(6)].map((_, i) => (
                    <ProductListItemSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <Button variant='outline' disabled>
                    <Skeleton className='h-4 w-16' />
                  </Button>

                  <div className='flex space-x-2'>
                    {[...Array(5)].map((_, i) => (
                      <Button key={i} variant={i === 1 ? 'default' : 'outline'} size='sm' disabled>
                        {i + 1}
                      </Button>
                    ))}
                  </div>

                  <Button variant='outline' disabled>
                    <Skeleton className='h-4 w-16' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================================
// LAZY COMPONENT
// ===================================

const LazyShopWithSidebar = (props: any) => {
  return (
    <Suspense fallback={<ShopWithSidebarSkeleton />}>
      <ShopWithSidebar {...props} />
    </Suspense>
  )
}

export default LazyShopWithSidebar
export { ShopWithSidebarSkeleton }
