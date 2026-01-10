/**
 * Tipos compartidos para el Hero Banner
 */

export interface HeroSlide {
  id: string
  image: string
  alt: string
}

export interface HeroCarouselProps {
  slides?: HeroSlide[]
  autoPlayInterval?: number
  startIndex?: number
  onSlideChange?: (index: number) => void
}

export interface NavigationButtonProps {
  direction: 'prev' | 'next'
  onClick: () => void
  ariaLabel: string
}

export interface IndicatorProps {
  total: number
  currentIndex: number
  onIndicatorClick: (index: number) => void
}

export interface SlideProps {
  slide: HeroSlide
  index: number
  isTransitioning: boolean
}
