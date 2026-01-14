/**
 * Category Styles Utilities
 * Design system utilities for Categories component
 * Pinteya E-commerce - Enterprise Design System
 */

import { cn } from '@/lib/core/utils'
import { categoryDesignTokens } from '../tokens/categories'
// Note: CategoryPillProps and CategoriesProps are component-specific types
// They are not part of the core category types, so we'll define them locally if needed
// For now, using any to maintain compatibility
type CategoryPillProps = any
type CategoriesProps = any

/**
 * Size variant type
 */
type SizeVariant = 'sm' | 'md' | 'lg'

/**
 * Style variant type
 */
type StyleVariant = 'default' | 'outline' | 'ghost'

/**
 * Component variant type
 */
type ComponentVariant = 'default' | 'compact' | 'minimal'

/**
 * Get category pill styles based on props
 */
export const getCategoryPillStyles = ({
  size = 'md',
  isSelected = false,
  disabled = false,
  variant = 'default',
}: {
  size?: SizeVariant
  isSelected?: boolean
  disabled?: boolean
  variant?: StyleVariant
}) => {
  const tokens = categoryDesignTokens
  const sizeConfig = tokens.variants.size[size]
  const styleConfig = tokens.variants.style[variant]

  return cn(
    // Base styles
    'relative flex items-center gap-2 rounded-full font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',

    // Size-specific styles
    size === 'sm' && 'pl-6 pr-3 py-1.5 text-xs',
    size === 'md' && 'pl-8 pr-4 py-2 text-sm',
    size === 'lg' && 'pl-10 pr-5 py-3 text-base',

    // Variant-specific styles
    variant === 'default' && [
      'text-white',
      isSelected
        ? 'bg-[#007639] shadow-lg ring-2 ring-[#007639] ring-offset-2'
        : 'bg-[#007639] hover:bg-[#005a2b] hover:shadow-md',
    ],
    variant === 'outline' && [
      'border border-[#007639] text-[#007639]',
      isSelected
        ? 'bg-[#007639] text-white shadow-lg ring-2 ring-[#007639] ring-offset-2'
        : 'bg-transparent hover:bg-[#007639] hover:text-white hover:shadow-md',
    ],
    variant === 'ghost' && [
      'text-gray-700',
      isSelected
        ? 'bg-gray-100 text-[#007639] shadow-md ring-2 ring-gray-300 ring-offset-1'
        : 'bg-transparent hover:bg-gray-50 hover:shadow-sm',
    ],

    // Interactive states - Fixed: Removed transform scale to prevent Header interference
    !disabled && ['hover:brightness-110 active:brightness-95 hover:shadow-md', 'cursor-pointer'],

    // Focus styles
    'focus:ring-[#ea5a17]',

    // Disabled styles - Fixed: Removed transform scale references
    disabled && ['opacity-50 cursor-not-allowed', 'hover:brightness-100 active:brightness-100']
  )
}

/**
 * Get category icon container styles
 */
export const getCategoryIconStyles = ({ size = 'md' }: { size?: SizeVariant }) => {
  return cn(
    'absolute flex items-center justify-center',
    size === 'sm' && 'w-6 h-6 -left-0.5',
    size === 'md' && 'w-10 h-10 -left-1',
    size === 'lg' && 'w-12 h-12 -left-1.5'
  )
}

/**
 * Get category text styles
 */
export const getCategoryTextStyles = ({ size = 'md' }: { size?: SizeVariant }) => {
  return cn(
    'font-semibold whitespace-nowrap',
    size === 'sm' && 'ml-1',
    size === 'md' && 'ml-2',
    size === 'lg' && 'ml-3'
  )
}

/**
 * Get category count styles
 */
export const getCategoryCountStyles = ({ size = 'md' }: { size?: SizeVariant }) => {
  return cn(
    'opacity-75',
    size === 'sm' && 'text-2xs',
    size === 'md' && 'text-xs',
    size === 'lg' && 'text-sm'
  )
}

/**
 * Get categories container styles
 */
export const getCategoriesContainerStyles = ({
  variant = 'default',
  disabled = false,
  className,
}: {
  variant?: ComponentVariant
  disabled?: boolean
  className?: string
}) => {
  return cn(
    // Base styles
    'py-12',

    // Variant-specific styles
    variant === 'default' && 'bg-gradient-to-br from-orange-50 to-yellow-50',
    variant === 'compact' && 'py-6 bg-gray-50',
    variant === 'minimal' && 'py-4 bg-transparent',

    // Disabled styles
    disabled && 'opacity-50 pointer-events-none',

    // Custom className
    className
  )
}

/**
 * Get categories header styles
 */
export const getCategoriesHeaderStyles = ({
  variant = 'default',
}: {
  variant?: ComponentVariant
}) => {
  return cn(
    'text-center',
    variant === 'default' && 'mb-8',
    variant === 'compact' && 'mb-6',
    variant === 'minimal' && 'mb-4'
  )
}

/**
 * Get categories title styles
 */
export const getCategoriesTitleStyles = ({
  variant = 'default',
}: {
  variant?: ComponentVariant
}) => {
  return cn(
    'font-bold text-gray-900 dark:text-gray-200',
    variant === 'default' && 'text-2xl md:text-3xl',
    variant === 'compact' && 'text-xl md:text-2xl',
    variant === 'minimal' && 'text-lg md:text-xl'
  )
}

/**
 * Get categories grid styles
 */
export const getCategoriesGridStyles = ({
  variant = 'default',
}: {
  variant?: ComponentVariant
}) => {
  return cn(
    'max-w-5xl mx-auto',
    variant === 'compact' && 'max-w-4xl',
    variant === 'minimal' && 'max-w-3xl'
  )
}

/**
 * Get categories row styles
 */
export const getCategoriesRowStyles = ({ isSecondRow = false }: { isSecondRow?: boolean }) => {
  return cn('flex flex-wrap justify-center gap-2', !isSecondRow && 'mb-3')
}

/**
 * Get clear button styles
 */
export const getClearButtonStyles = () => {
  return cn(
    'text-sm text-gray-600 hover:text-gray-800 underline',
    'focus:outline-none focus:ring-2 focus:ring-[#ea5a17] focus:ring-offset-2 rounded',
    'transition-colors duration-200'
  )
}

/**
 * Get loading state styles
 */
export const getLoadingStyles = () => {
  return cn('animate-pulse')
}

/**
 * Get error state styles
 */
export const getErrorStyles = () => {
  return cn('text-red-600')
}

/**
 * Get focus ring styles for accessibility
 */
export const getFocusRingStyles = () => {
  return cn('focus:outline-none focus:ring-2 focus:ring-[#ea5a17] focus:ring-offset-2')
}

/**
 * Get responsive styles for different breakpoints
 */
export const getResponsiveStyles = ({
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
}: {
  hideOnMobile?: boolean
  hideOnTablet?: boolean
  hideOnDesktop?: boolean
}) => {
  return cn(
    hideOnMobile && 'hidden sm:block',
    hideOnTablet && 'sm:hidden lg:block',
    hideOnDesktop && 'lg:hidden'
  )
}

/**
 * Get animation styles
 */
export const getAnimationStyles = ({
  type = 'default',
}: {
  type?: 'default' | 'bounce' | 'slide' | 'fade'
}) => {
  return cn(
    type === 'default' && 'transition-all duration-200',
    type === 'bounce' && 'transition-transform duration-200 ease-bounce',
    type === 'slide' && 'transition-transform duration-300 ease-out',
    type === 'fade' && 'transition-opacity duration-200'
  )
}

/**
 * Utility to generate CSS custom properties from design tokens
 */
export const getCSSCustomProperties = () => {
  const tokens = categoryDesignTokens

  return {
    '--category-color-primary': tokens.colors.brand.green.DEFAULT,
    '--category-color-primary-hover': tokens.colors.brand.green.dark,
    '--category-color-focus': tokens.colors.brand.orange.DEFAULT,
    '--category-border-radius': tokens.borderRadius.full,
    '--category-shadow': tokens.shadows.md,
    '--category-shadow-focus': tokens.shadows.focus,
    '--category-duration': tokens.animations.duration.normal,
    '--category-timing': tokens.animations.timing.easeOut,
  }
}

/**
 * Utility to apply design tokens as inline styles
 */
export const applyDesignTokens = (element: HTMLElement) => {
  const properties = getCSSCustomProperties()

  Object.entries(properties).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })
}

/**
 * Export all style utilities
 */
export const categoryStyleUtils = {
  getCategoryPillStyles,
  getCategoryIconStyles,
  getCategoryTextStyles,
  getCategoryCountStyles,
  getCategoriesContainerStyles,
  getCategoriesHeaderStyles,
  getCategoriesTitleStyles,
  getCategoriesGridStyles,
  getCategoriesRowStyles,
  getClearButtonStyles,
  getLoadingStyles,
  getErrorStyles,
  getFocusRingStyles,
  getResponsiveStyles,
  getAnimationStyles,
  getCSSCustomProperties,
  applyDesignTokens,
}
