// =====================================================
// COMPONENTE: LOADING SKELETON
// Descripción: Componente de skeleton loading para estados de carga
// Basado en: shadcn/ui patterns + Tailwind CSS
// =====================================================

import { cn } from '@/lib/core/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'sm' | 'md' | 'lg' | 'full';
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

const heightClasses = {
  sm: 'h-4',
  md: 'h-6',
  lg: 'h-8',
  xl: 'h-12'
};

const widthClasses = {
  sm: 'w-1/4',
  md: 'w-1/2',
  lg: 'w-3/4',
  full: 'w-full'
};

export function LoadingSkeleton({
  className,
  lines = 1,
  height = 'md',
  width = 'full',
  variant = 'default'
}: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={cn('space-y-4 p-6 border rounded-lg', className)}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('w-12 h-12 bg-gray-200 rounded-full animate-pulse', className)} />
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn('h-10 w-24 bg-gray-200 rounded animate-pulse', className)} />
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-gray-200 rounded animate-pulse',
              heightClasses[height],
              i === lines - 1 ? widthClasses.lg : widthClasses[width]
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded animate-pulse',
            heightClasses[height],
            widthClasses[width]
          )}
        />
      ))}
    </div>
  );
}









