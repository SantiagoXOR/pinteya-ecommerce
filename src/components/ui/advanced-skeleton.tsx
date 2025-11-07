/**
 * ⚡ PERFORMANCE: Advanced Skeleton Screens con Shimmer Effect
 * 
 * Skeletons modernos con animación shimmer para mejor UX
 * Mejora percepción de velocidad durante la carga de contenido
 * 
 * @example
 * <AdvancedSkeleton variant="rectangular" width={200} height={300} />
 * <ProductCardSkeleton />
 * <HeroSkeleton />
 */

import React from 'react'
import { cn } from '@/lib/utils'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'button'
export type SkeletonAnimation = 'pulse' | 'wave' | 'shimmer' | 'none'

export interface SkeletonProps {
  /**
   * Clases CSS adicionales
   */
  className?: string

  /**
   * Variante del skeleton
   * @default 'rectangular'
   */
  variant?: SkeletonVariant

  /**
   * Tipo de animación
   * @default 'shimmer'
   */
  animation?: SkeletonAnimation

  /**
   * Ancho (puede ser número en px o string con unidad)
   */
  width?: string | number

  /**
   * Alto (puede ser número en px o string con unidad)
   */
  height?: string | number

  /**
   * Si es true, muestra el skeleton en modo oscuro
   * @default false
   */
  dark?: boolean
}

export function AdvancedSkeleton({
  className,
  variant = 'rectangular',
  animation = 'shimmer',
  width,
  height,
  dark = false,
}: SkeletonProps) {
  const variantClasses: Record<SkeletonVariant, string> = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
    button: 'rounded-md h-10',
  }

  const animationClasses: Record<SkeletonAnimation, string> = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    shimmer: 'skeleton-shimmer',
    none: '',
  }

  const baseColor = dark ? 'bg-gray-700' : 'bg-gray-200'

  return (
    <div
      className={cn(
        baseColor,
        variantClasses[variant],
        animationClasses[animation],
        'relative overflow-hidden',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-busy="true"
      aria-live="polite"
    />
  )
}

/**
 * Skeleton para Product Card
 */
export function ProductCardSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div className="space-y-3 p-4 bg-white rounded-xl shadow-sm">
      {/* Imagen del producto */}
      <AdvancedSkeleton
        variant="rectangular"
        height={200}
        animation="shimmer"
        dark={dark}
      />

      {/* Título */}
      <AdvancedSkeleton
        variant="text"
        width="80%"
        animation="shimmer"
        dark={dark}
      />

      {/* Subtítulo */}
      <AdvancedSkeleton
        variant="text"
        width="60%"
        animation="shimmer"
        dark={dark}
      />

      {/* Precio y botón */}
      <div className="flex gap-2 pt-2">
        <AdvancedSkeleton
          variant="button"
          width={80}
          animation="shimmer"
          dark={dark}
        />
        <AdvancedSkeleton
          variant="button"
          width={120}
          animation="shimmer"
          dark={dark}
        />
      </div>
    </div>
  )
}

/**
 * Skeleton para Hero Section
 */
export function HeroSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div className="relative h-[320px] lg:h-[500px] bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 skeleton-shimmer opacity-30" />

      {/* Contenido placeholder */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4 relative z-10">
        <AdvancedSkeleton
          variant="text"
          width="60%"
          height={48}
          className="bg-white/20"
          animation="shimmer"
        />
        <AdvancedSkeleton
          variant="text"
          width="40%"
          height={32}
          className="bg-white/20"
          animation="shimmer"
        />
        <div className="flex gap-4 pt-4">
          <AdvancedSkeleton
            variant="button"
            width={180}
            height={48}
            className="bg-white/20"
            animation="shimmer"
          />
          <AdvancedSkeleton
            variant="button"
            width={180}
            height={48}
            className="bg-white/20"
            animation="shimmer"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para lista de productos
 */
export function ProductListSkeleton({
  count = 6,
  dark = false,
}: {
  count?: number
  dark?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} dark={dark} />
      ))}
    </div>
  )
}

/**
 * Skeleton para testimonios
 */
export function TestimonialSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div className="space-y-4 p-6 bg-white rounded-xl shadow-sm">
      {/* Avatar y nombre */}
      <div className="flex items-center gap-3">
        <AdvancedSkeleton
          variant="circular"
          width={48}
          height={48}
          animation="shimmer"
          dark={dark}
        />
        <div className="flex-1 space-y-2">
          <AdvancedSkeleton
            variant="text"
            width="60%"
            animation="shimmer"
            dark={dark}
          />
          <AdvancedSkeleton
            variant="text"
            width="40%"
            animation="shimmer"
            dark={dark}
          />
        </div>
      </div>

      {/* Testimonio */}
      <div className="space-y-2">
        <AdvancedSkeleton
          variant="text"
          width="100%"
          animation="shimmer"
          dark={dark}
        />
        <AdvancedSkeleton
          variant="text"
          width="95%"
          animation="shimmer"
          dark={dark}
        />
        <AdvancedSkeleton
          variant="text"
          width="80%"
          animation="shimmer"
          dark={dark}
        />
      </div>
    </div>
  )
}

/**
 * Skeleton para Newsletter
 */
export function NewsletterSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div className="space-y-4 p-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
      <AdvancedSkeleton
        variant="text"
        width="60%"
        height={32}
        className="bg-white/20 mx-auto"
        animation="shimmer"
      />
      <AdvancedSkeleton
        variant="text"
        width="40%"
        height={24}
        className="bg-white/20 mx-auto"
        animation="shimmer"
      />
      <div className="flex gap-2 max-w-md mx-auto pt-4">
        <AdvancedSkeleton
          variant="rectangular"
          className="flex-1 bg-white/20"
          height={48}
          animation="shimmer"
        />
        <AdvancedSkeleton
          variant="button"
          width={120}
          height={48}
          className="bg-white/20"
          animation="shimmer"
        />
      </div>
    </div>
  )
}

/**
 * Skeleton para sección completa
 */
export function SectionSkeleton({
  title = true,
  items = 3,
  dark = false,
}: {
  title?: boolean
  items?: number
  dark?: boolean
}) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="space-y-2">
          <AdvancedSkeleton
            variant="text"
            width="30%"
            height={32}
            animation="shimmer"
            dark={dark}
          />
          <AdvancedSkeleton
            variant="text"
            width="50%"
            height={20}
            animation="shimmer"
            dark={dark}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: items }).map((_, index) => (
          <AdvancedSkeleton
            key={index}
            variant="rectangular"
            height={300}
            animation="shimmer"
            dark={dark}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * HOC para agregar skeleton loading a cualquier componente
 */
export function withSkeleton<P extends object>(
  Component: React.ComponentType<P>,
  SkeletonComponent: React.ComponentType<any>
) {
  return function SkeletonWrapper(props: P & { loading?: boolean }) {
    const { loading, ...restProps } = props

    if (loading) {
      return <SkeletonComponent />
    }

    return <Component {...(restProps as P)} />
  }
}











