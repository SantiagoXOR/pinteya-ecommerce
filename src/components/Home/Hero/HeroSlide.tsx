/**
 * HeroSlide Component
 * Componente individual para cada slide del hero
 * Implementa layouts separados y optimizados para mobile y desktop
 */

'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HeroSlideProps } from '@/types/hero'
import { HeroBadge } from './HeroBadge'
import { ArrowRight } from 'lucide-react'

/**
 * Resaltar palabras específicas en el título
 */
const highlightWords = (title: string, wordsToHighlight?: string[]): React.ReactNode => {
  if (!wordsToHighlight || wordsToHighlight.length === 0) {
    return title
  }

  const parts = title.split(' ')
  
  return parts.map((part, index) => {
    const cleanPart = part.replace(/[,!?.]/, '')
    const isHighlighted = wordsToHighlight.some(
      word => word.toLowerCase() === cleanPart.toLowerCase()
    )
    const punctuation = part.match(/[,!?.]/) ? part[part.length - 1] : ''
    
    return (
      <React.Fragment key={index}>
        {isHighlighted ? (
          <span className="text-yellow-300">{cleanPart}</span>
        ) : (
          cleanPart
        )}
        {punctuation}
        {index < parts.length - 1 ? ' ' : ''}
      </React.Fragment>
    )
  })
}

export const HeroSlide: React.FC<HeroSlideProps> = ({
  slide,
  className = '',
  isActive = true,
}) => {
  const {
    backgroundGradient,
    mainTitle,
    subtitle,
    highlightedWords: wordsToHighlight,
    badges = [],
    productImages,
    cta,
    mobileTitle,
    mobileLayout = 'vertical',
  } = slide

  const titleToDisplay = mobileTitle || mainTitle

  return (
    <div
      className={`
        relative w-full h-full
        bg-gradient-to-br ${backgroundGradient}
        overflow-hidden
        ${className}
      `}
    >
      {/* ==================== LAYOUT MOBILE ==================== */}
      <div className="lg:hidden px-4 py-4 sm:py-6 flex flex-col items-center text-center space-y-4 sm:space-y-6">
        {/* Título principal - Mobile */}
        <h1 className="text-3xl xsm:text-4xl sm:text-5xl font-bold text-white leading-tight drop-shadow-2xl max-w-xl">
          {highlightWords(titleToDisplay, wordsToHighlight)}
        </h1>

        {/* Subtitle - Mobile */}
        {subtitle && (
          <p className="text-base sm:text-lg text-white/90 max-w-md drop-shadow-lg">
            {subtitle}
          </p>
        )}

        {/* Badges - Mobile: en fila horizontal con wrap */}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-lg">
            {badges.map((badge, index) => (
              <HeroBadge
                key={`badge-mobile-${index}`}
                badge={badge}
                size="sm"
                className="shadow-xl"
              />
            ))}
          </div>
        )}

        {/* Imagen principal - Mobile: solo la primera imagen */}
        {productImages.length > 0 && productImages[0] && (
          <div 
            className="relative w-full mt-4"
            style={{
              maxWidth: productImages[0].mobileSize?.width || '95%',
              aspectRatio: productImages[0].aspectRatio || 'auto',
              margin: '0 auto',
            }}
          >
            <Image
              src={productImages[0].src}
              alt={productImages[0].alt}
              fill
              className="object-contain drop-shadow-2xl"
              priority={productImages[0].priority ?? false}
              sizes="(max-width: 640px) 95vw, (max-width: 1024px) 80vw, 50vw"
              quality={80} // ⚡ OPTIMIZACIÓN: Balance tamaño/calidad para WebP
              unoptimized={false} // ⚡ OPTIMIZACIÓN: Permitir optimización de Next.js
              style={{ objectPosition: 'center' }}
            />
          </div>
        )}

        {/* CTA - Mobile */}
        {cta && (
          <Link
            href={cta.href}
            className="
              inline-flex items-center gap-2
              px-6 py-3 sm:px-8 sm:py-4
              bg-white text-blaze-orange-600
              font-bold text-base sm:text-lg
              rounded-full
              shadow-xl
              hover:shadow-2xl
              hover:scale-105
              transition-all duration-300
              mt-2
            "
          >
            {cta.text}
            {cta.icon || <ArrowRight className="w-5 h-5" />}
          </Link>
        )}
      </div>

      {/* ==================== LAYOUT DESKTOP ==================== */}
      <div className="hidden lg:block h-full">
        <div className="max-w-7xl mx-auto px-6 xl:px-8 h-full">
          <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center h-full py-12 xl:py-16">
            
            {/* ========== COLUMNA IZQUIERDA: Texto + Badges ========== */}
            <div className="space-y-6 xl:space-y-8 lg:pr-8">
              {/* Título principal - Desktop */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                {highlightWords(mainTitle, wordsToHighlight)}
              </h1>

              {/* Subtitle - Desktop */}
              {subtitle && (
                <p className="text-lg xl:text-xl text-white/90 max-w-xl drop-shadow-lg leading-relaxed">
                  {subtitle}
                </p>
              )}

              {/* Badges - Desktop: apilados verticalmente o en grid */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-3 xl:gap-4 max-w-2xl">
                  {badges.map((badge, index) => (
                    <HeroBadge
                      key={`badge-desktop-${index}`}
                      badge={badge}
                      size={index === 0 ? 'lg' : 'md'}
                      className="shadow-xl"
                    />
                  ))}
                </div>
              )}

              {/* CTA - Desktop */}
              {cta && (
                <div className="pt-4">
                  <Link
                    href={cta.href}
                    className={`
                      inline-flex items-center gap-3
                      px-8 py-4 xl:px-10 xl:py-5
                      ${cta.variant === 'outline' 
                        ? 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-blaze-orange-600' 
                        : 'bg-white text-blaze-orange-600 hover:bg-yellow-50'
                      }
                      font-bold text-lg xl:text-xl
                      rounded-full
                      shadow-2xl
                      hover:shadow-3xl
                      hover:scale-105
                      transition-all duration-300
                    `}
                  >
                    {cta.text}
                    {cta.icon || <ArrowRight className="w-6 h-6" />}
                  </Link>
                </div>
              )}
            </div>

            {/* ========== COLUMNA DERECHA: Imágenes de Productos ========== */}
            <div className="relative h-[380px] lg:h-[420px] xl:h-[480px] 2xl:h-[530px]">
              {productImages.map((image, index) => {
                // Posición por defecto si no se especifica
                const defaultPosition = {
                  top: index === 0 ? '50%' : `${20 + index * 15}%`,
                  left: index === 0 ? '50%' : `${10 + index * 20}%`,
                }

                const position = image.position || defaultPosition
                const desktopSize = image.desktopSize || image.size || { width: '70%' }

                return (
                  <div
                    key={`product-desktop-${index}`}
                    className="absolute"
                    style={{
                      top: position.top || 'auto',
                      bottom: (position as any).bottom || 'auto',
                      left: position.left || 'auto',
                      right: (position as any).right || 'auto',
                      width: desktopSize.width,
                      height: desktopSize.height || 'auto',
                      maxWidth: 'min(100%, 600px)',
                      maxHeight: '100%',
                      aspectRatio: image.aspectRatio || 'auto',
                      zIndex: image.zIndex || index + 1,
                      transform:
                        position.top === '50%' && position.left === '50%'
                          ? 'translate(-50%, -50%)'
                          : 'none',
                    }}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className={`object-contain drop-shadow-2xl ${image.className || ''}`}
                        priority={image.priority || index === 0}
                        sizes="(max-width: 1024px) 70vw, 50vw"
                        quality={80} // ⚡ OPTIMIZACIÓN: Balance tamaño/calidad para WebP
                        unoptimized={false} // ⚡ OPTIMIZACIÓN: Permitir optimización de Next.js
                        style={{ objectPosition: 'center' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Elementos decorativos sutiles */}
      <div className="absolute top-6 right-6 w-12 h-12 bg-white/5 rounded-full blur-lg pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 bg-white/5 rounded-full blur-md pointer-events-none" />
      <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-yellow-300/10 rounded-full blur-sm pointer-events-none" />
    </div>
  )
}

export default HeroSlide

