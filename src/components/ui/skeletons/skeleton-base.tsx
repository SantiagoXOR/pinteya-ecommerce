/**
 * Skeleton Base Components
 * 
 * Componentes base para crear skeletons consistentes en toda la aplicación.
 * Incluyen animación pulse y accesibilidad integrada.
 */

import { cn } from '@/lib/utils'

interface SkeletonBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  animate?: boolean
  children?: React.ReactNode
}

/**
 * Componente base para skeletons
 * Incluye animación pulse por defecto y atributos de accesibilidad
 */
export function SkeletonBase({ 
  className, 
  animate = true, 
  children,
  ...props 
}: SkeletonBaseProps) {
  return (
    <div 
      className={cn(
        'bg-gray-200 rounded',
        animate && 'animate-pulse',
        className
      )}
      aria-busy="true"
      aria-live="polite"
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Skeleton para texto (altura 16px por defecto)
 */
export function SkeletonText({ className, ...props }: SkeletonBaseProps) {
  return <SkeletonBase className={cn('h-4 rounded', className)} {...props} />
}

interface SkeletonCircleProps extends SkeletonBaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Skeleton circular para avatares e iconos
 */
export function SkeletonCircle({ 
  className, 
  size = 'md', 
  ...props 
}: SkeletonCircleProps) {
  const sizes = { 
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-10 h-10', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }
  return <SkeletonBase className={cn('rounded-full', sizes[size], className)} {...props} />
}

/**
 * Skeleton rectangular para imágenes y contenedores
 */
export function SkeletonRect({ className, ...props }: SkeletonBaseProps) {
  return <SkeletonBase className={cn('rounded-lg', className)} {...props} />
}
