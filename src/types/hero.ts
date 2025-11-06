/**
 * Hero Section Types
 * Definiciones de tipos para el sistema modular de hero responsive
 */

/**
 * Tipo de badge promocional
 */
export type BadgeType = 'discount' | 'shipping' | 'installments' | 'payment' | 'delivery'

/**
 * Variante de color para badges
 */
export type BadgeVariant = 'yellow' | 'orange' | 'green' | 'blue'

/**
 * Posición de un elemento en el hero
 */
export interface Position {
  top?: string
  bottom?: string
  left?: string
  right?: string
}

/**
 * Tamaño de un elemento
 */
export interface Size {
  width?: string
  height?: string
}

/**
 * Configuración de badge promocional
 */
export interface HeroBadge {
  type: BadgeType
  text: string
  subtitle?: string
  variant?: BadgeVariant
  icon?: React.ReactNode | string
}

/**
 * Configuración de imagen de producto en el hero
 */
export interface ProductImage {
  src: string
  alt: string
  priority?: boolean
  position?: Position
  size?: Size
  zIndex?: number
  className?: string
  // Responsive positioning
  mobilePosition?: Position
  mobileSize?: Size
}

/**
 * Configuración de CTA (Call To Action)
 */
export interface HeroCTA {
  text: string
  href: string
  variant?: 'primary' | 'secondary' | 'outline'
  icon?: React.ReactNode
}

/**
 * Configuración completa de un slide del hero
 */
export interface HeroSlide {
  id: string
  backgroundGradient: string
  mainTitle: string
  subtitle?: string
  highlightedWords?: string[]
  badges?: HeroBadge[]
  productImages: ProductImage[]
  cta?: HeroCTA
  // Configuración responsive
  mobileTitle?: string
  mobileLayout?: 'vertical' | 'horizontal'
}

/**
 * Props para el componente HeroSlide
 */
export interface HeroSlideProps {
  slide: HeroSlide
  className?: string
  isActive?: boolean
}

/**
 * Props para el componente HeroBadge
 */
export interface HeroBadgeProps {
  badge: HeroBadge
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

