import { LucideIcon, Package, Search, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  variant?: 'default' | 'search' | 'error'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default'
}: EmptyStateProps) {
  const defaultIcons = {
    default: Package,
    search: Search,
    error: AlertCircle
  }
  
  const DisplayIcon = Icon || defaultIcons[variant]
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className={cn(
        'rounded-full p-6 mb-4',
        variant === 'error' ? 'bg-destructive/10' : 'bg-muted'
      )}>
        <DisplayIcon className={cn(
          'h-12 w-12',
          variant === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )} />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}

