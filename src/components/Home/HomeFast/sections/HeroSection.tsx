import Image from 'next/image'
import { HOME_FAST_CONFIG } from '@/lib/home-fast/config'
import type { HeroSectionProps } from '../types'

/**
 * HeroSection - Server Component optimizado
 * Renderiza imagen hero con dimensiones explícitas para prevenir CLS
 */
export function HeroSection({ 
  imageUrl = '/images/hero/hero2/hero1.webp',
  alt = 'Pinturas y productos de construcción',
  title,
  subtitle,
  className 
}: HeroSectionProps) {
  const { width, height, priority } = HOME_FAST_CONFIG.images.hero

  return (
    <section className={`relative w-full ${className || ''}`}>
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          fetchPriority="high"
          className="object-cover w-full h-full"
          sizes="100vw"
        />
        {(title || subtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white px-4">
            {title && (
              <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-center max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
