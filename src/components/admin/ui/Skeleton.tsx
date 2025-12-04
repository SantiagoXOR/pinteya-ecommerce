import { cn } from '@/lib/core/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circle' | 'rectangle'
  animation?: 'pulse' | 'shimmer' | 'none'
}

export function Skeleton({ 
  className, 
  variant = 'default',
  animation = 'shimmer'
}: SkeletonProps) {
  const baseStyles = 'bg-muted rounded'
  
  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
    none: ''
  }
  
  const variantStyles = {
    default: '',
    circle: 'rounded-full',
    rectangle: 'rounded-md'
  }
  
  return (
    <div 
      className={cn(
        baseStyles,
        animationStyles[animation],
        variantStyles[variant],
        className
      )}
    />
  )
}

export function ProductListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <Skeleton variant="rectangle" className="h-16 w-16 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 10, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

