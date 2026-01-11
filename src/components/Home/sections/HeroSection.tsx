import Image from 'next/image'
import type { Category } from '@/types/category'
import type { Product } from '@/types/product'

interface HeroSectionProps {
  isDesktop?: boolean
}

/**
 * HeroSection - Server Component optimizado
 * Renderiza imagen hero con dimensiones explícitas para prevenir CLS
 * Sin carousel inicial para máxima performance
 */
export function HeroSection({ isDesktop = false }: HeroSectionProps) {
  const heroImage = '/images/hero/hero2/hero1.webp'
  const heroAlt = 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad - Pinteya'

  if (isDesktop) {
    return (
      <div className='pt-1 sm:pt-2 -mt-[105px]'>
        <div className='max-w-[1170px] mx-auto lg:px-8 xl:px-8 pt-[105px]'>
          <div 
            className="relative overflow-hidden rounded-3xl"
            style={{ 
              aspectRatio: '2.77',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <Image
              src={heroImage}
              alt={heroAlt}
              width={1200}
              height={433}
              priority={true}
              fetchPriority="high"
              className="object-cover rounded-3xl"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              sizes="100vw"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='pt-1 sm:pt-2 w-full' style={{ width: '100%', maxWidth: '100%' }}>
      <div 
        className="relative w-full overflow-hidden"
        style={{ 
          aspectRatio: '2.77',
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <Image
          src={heroImage}
          alt={heroAlt}
          width={1200}
          height={433}
          priority={true}
          fetchPriority="high"
          className="object-cover"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          sizes="100vw"
        />
      </div>
    </div>
  )
}
