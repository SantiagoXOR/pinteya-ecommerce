// ===================================
// PINTEYA E-COMMERCE - LAZY SHOP DETAILS
// Wrapper con lazy loading para el componente ShopDetails (70.73KB)
// ===================================

'use client'

import React, { lazy, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Heart,
  Star,
  ZoomIn,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
} from 'lucide-react'

// Lazy loading del componente principal
const ShopDetails = lazy(() => import('./index'))

// ===================================
// SKELETON COMPONENT
// ===================================

const ShopDetailsSkeleton = () => (
  <div className='min-h-screen bg-gray-50'>
    {/* Breadcrumb skeleton */}
    <div className='container mx-auto px-4 py-4'>
      <div className='flex items-center space-x-2 mb-6'>
        <Skeleton className='h-4 w-12' />
        <span className='text-gray-400'>/</span>
        <Skeleton className='h-4 w-16' />
        <span className='text-gray-400'>/</span>
        <Skeleton className='h-4 w-24' />
      </div>
    </div>

    <div className='container mx-auto px-4 pb-12'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
        {/* Product Images Section */}
        <div className='space-y-4'>
          {/* Main product image */}
          <Card className='overflow-hidden'>
            <div className='relative aspect-square bg-gray-100 animate-pulse'>
              <div className='absolute inset-0 flex items-center justify-center'>
                <ZoomIn className='w-12 h-12 text-gray-300' />
              </div>
              {/* Zoom button skeleton */}
              <div className='absolute top-4 right-4'>
                <Skeleton className='w-10 h-10 rounded-full' />
              </div>
            </div>
          </Card>

          {/* Thumbnail images */}
          <div className='flex space-x-2 overflow-x-auto'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='w-20 h-20 rounded-lg flex-shrink-0' />
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className='space-y-6'>
          {/* Product title and rating */}
          <div className='space-y-3'>
            <Skeleton className='h-8 w-3/4' />
            <div className='flex items-center space-x-2'>
              <div className='flex space-x-1'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='w-4 h-4 text-gray-200' />
                ))}
              </div>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>

          {/* Price section */}
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <Skeleton className='h-8 w-24' />
              <Skeleton className='h-6 w-20' />
            </div>
            <div className='flex space-x-2'>
              <Badge variant='secondary' className='animate-pulse'>
                <Skeleton className='h-4 w-16' />
              </Badge>
              <Badge variant='outline' className='animate-pulse'>
                <Skeleton className='h-4 w-12' />
              </Badge>
            </div>
          </div>

          {/* Product options */}
          <div className='space-y-4'>
            {/* Color options */}
            <div className='space-y-2'>
              <Skeleton className='h-5 w-16' />
              <div className='flex space-x-2'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='w-8 h-8 rounded-full' />
                ))}
              </div>
            </div>

            {/* Storage options */}
            <div className='space-y-2'>
              <Skeleton className='h-5 w-20' />
              <div className='flex space-x-2'>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className='h-10 w-20 rounded-md' />
                ))}
              </div>
            </div>

            {/* Type options */}
            <div className='space-y-2'>
              <Skeleton className='h-5 w-12' />
              <div className='flex space-x-2'>
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className='h-10 w-16 rounded-md' />
                ))}
              </div>
            </div>
          </div>

          {/* Quantity and actions */}
          <div className='space-y-4'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center border rounded-md'>
                <Button variant='ghost' size='sm' disabled>
                  <Minus className='w-4 h-4' />
                </Button>
                <Skeleton className='h-8 w-12' />
                <Button variant='ghost' size='sm' disabled>
                  <Plus className='w-4 h-4' />
                </Button>
              </div>
              <Skeleton className='h-5 w-16' />
            </div>

            {/* Action buttons */}
            <div className='flex space-x-3'>
              <Button disabled className='flex-1'>
                <ShoppingCart className='w-4 h-4 mr-2' />
                <Skeleton className='h-4 w-20' />
              </Button>
              <Button variant='outline' size='icon' disabled>
                <Heart className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Shipping and guarantees */}
          <div className='space-y-3 pt-4 border-t'>
            {[
              { icon: Truck, text: 'Envío gratis' },
              { icon: Shield, text: 'Garantía' },
              { icon: RotateCcw, text: 'Devoluciones' },
            ].map((item, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <item.icon className='w-5 h-5 text-gray-300' />
                <Skeleton className='h-4 w-32' />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product tabs skeleton */}
      <Card className='mb-8'>
        <div className='border-b'>
          <div className='flex space-x-8 px-6'>
            {['Descripción', 'Especificaciones', 'Reseñas'].map((tab, i) => (
              <Skeleton key={i} className='h-12 w-24' />
            ))}
          </div>
        </div>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-4 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Related products skeleton */}
      <div className='space-y-6'>
        <Skeleton className='h-8 w-48' />
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className='overflow-hidden'>
              <Skeleton className='aspect-square w-full' />
              <CardContent className='p-4 space-y-2'>
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-4 w-3/4' />
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-8 w-8 rounded' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// ===================================
// LAZY COMPONENT
// ===================================

const LazyShopDetails = (props: any) => {
  return (
    <Suspense fallback={<ShopDetailsSkeleton />}>
      <ShopDetails {...props} />
    </Suspense>
  )
}

export default LazyShopDetails
export { ShopDetailsSkeleton }
