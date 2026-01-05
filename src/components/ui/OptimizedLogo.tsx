/**
 * Componente optimizado para el logo de Pinteya
 * Incluye fallbacks automáticos y optimización de performance
 */

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import {
  pinteyaMobileLogoProps,
  pinteyaDesktopLogoProps,
  pinteyaHeroLogoProps,
  pinteyaMobileLogoPngProps,
  pinteyaDesktopLogoPngProps,
} from '@/utils/imageOptimization'

export type LogoVariant = 'mobile' | 'desktop' | 'hero'
export type LogoFormat = 'webp' | 'png' | 'auto'

interface OptimizedLogoProps {
  variant?: LogoVariant
  format?: LogoFormat
  className?: string
  onClick?: () => void
  'data-testid'?: string
}

/**
 * Obtiene las props del logo según la variante
 */
const getLogoProps = (variant: LogoVariant, format: LogoFormat) => {
  const baseProps = {
    mobile: format === 'png' ? pinteyaMobileLogoPngProps : pinteyaMobileLogoProps,
    desktop: format === 'png' ? pinteyaDesktopLogoPngProps : pinteyaDesktopLogoProps,
    hero: pinteyaHeroLogoProps,
  }

  return baseProps[variant]
}

/**
 * Componente de logo optimizado con fallbacks automáticos
 */
export const OptimizedLogo: React.FC<OptimizedLogoProps> = React.memo(({
  variant = 'desktop',
  format = 'auto',
  className,
  onClick,
  'data-testid': testId,
}) => {
  // ⚡ FASE 11-16: Código de debugging deshabilitado en producción para mejorar rendimiento
  // Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
  // React.useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     // Debug logging solo en desarrollo
  //   }
  // }, [variant, format, testId])

  const logoProps = getLogoProps(variant, format)

  // Clases base según la variante
  const baseClasses = {
    mobile: 'h-16 w-16 group-hover:scale-105 group-active:scale-95 transition-all duration-200',
    desktop: 'h-10 w-auto group-hover:scale-105 transition-transform duration-200',
    hero: 'h-20 w-auto',
  }

  const combinedClassName = cn(baseClasses[variant], logoProps.className, className)

  // ⚡ FIX: Para SVGs, usar <img> tag directamente para evitar re-fetches de Next.js Image
  // Next.js Image puede recargar SVGs en cada re-render incluso con unoptimized
  const isSVG = logoProps.src.endsWith('.svg')
  const logoSrc = React.useMemo(() => logoProps.src, [logoProps.src])
  
  if (isSVG) {
    // ⚡ FASE 3: Dimensiones explícitas para evitar CLS - calcular width basado en height y aspect ratio
    const logoDimensions = {
      desktop: { width: 160, height: 40 }, // Aspect ratio aproximado del logo
      mobile: { width: 48, height: 48 },
      hero: { width: 200, height: 80 },
    }
    const dimensions = logoDimensions[variant]
    
    return (
      <img
        src={logoSrc}
        alt={logoProps.alt || 'Pinteya Logo'}
        className={combinedClassName}
        onClick={onClick}
        data-testid={testId}
        // ⚡ FASE 3: Atributos HTML width y height explícitos para evitar CLS
        width={dimensions.width}
        height={dimensions.height}
        // ⚡ FIX: Key estable para evitar re-mounts innecesarios
        key={`logo-${variant}-${testId}`}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          // ⚡ FIX: Asegurar que el logo sea visible con dimensiones apropiadas
          // Usar height específico según la variante para garantizar visibilidad
          height: variant === 'desktop' ? '40px' : variant === 'mobile' ? '48px' : '80px',
          width: variant === 'desktop' ? 'auto' : variant === 'mobile' ? '48px' : 'auto',
          maxHeight: logoProps.height ? `${logoProps.height}px` : 'none',
          maxWidth: logoProps.width ? `${logoProps.width}px` : 'none',
          display: 'block', // ⚡ FIX: Evitar espacio extra debajo de la imagen
          objectFit: 'contain', // ⚡ FIX: Asegurar que el logo se ajuste correctamente
          // ⚡ FIX: Asegurar visibilidad explícita
          visibility: 'visible',
          opacity: 1,
        }}
        loading="eager"
        decoding="async"
      />
    )
  }
  
  return (
    <Image
      {...logoProps}
      src={logoSrc}
      unoptimized={false}
      className={combinedClassName}
      onClick={onClick}
      data-testid={testId}
      // ⚡ FIX: Key estable para evitar re-mounts innecesarios
      key={`logo-${variant}-${testId}`}
      priority={logoProps.priority !== false}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
      // Fallback automático para WebP
      onError={e => {
        const target = e.target as HTMLImageElement
        if (target.src.includes('.webp')) {
          // Cambiar a PNG si WebP falla
          const pngSrc = target.src.replace('.webp', '.png')
          target.src = pngSrc
        }
      }}
      onLoad={() => {
        // Limpiar cualquier placeholder después de cargar
        const img = document.querySelector(`[data-testid="${testId}"]`) as HTMLImageElement
        if (img) {
          img.style.opacity = '1'
        }
      }}
    />
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para memoización
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.format === nextProps.format &&
    prevProps.className === nextProps.className &&
    prevProps['data-testid'] === nextProps['data-testid'] &&
    prevProps.onClick === nextProps.onClick
  )
})

/**
 * Componente específico para el logo del header
 */
export const HeaderLogo: React.FC<{
  isMobile?: boolean
  className?: string
  onClick?: () => void
}> = React.memo(({ isMobile = false, className, onClick }) => {
  // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
  // React.useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     // Debug logging solo en desarrollo
  //   }
  // }, [isMobile, className, onClick])

  return (
    <OptimizedLogo
      variant={isMobile ? 'mobile' : 'desktop'}
      format='auto'
      className={className}
      onClick={onClick}
      data-testid={isMobile ? 'mobile-logo' : 'desktop-logo'}
    />
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick
  )
})

/**
 * Componente para el logo en secciones hero
 */
export const HeroLogo: React.FC<{
  className?: string
  onClick?: () => void
}> = ({ className, onClick }) => {
  return (
    <OptimizedLogo
      variant='hero'
      format='auto'
      className={className}
      onClick={onClick}
      data-testid='hero-logo'
    />
  )
}

export default OptimizedLogo
