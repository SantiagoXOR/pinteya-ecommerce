import { cn } from '@/lib/core/utils';

interface AdminCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
}

export function AdminCard({ 
  children, 
  title, 
  description, 
  actions,
  className,
  padding = 'md',
  variant = 'default'
}: AdminCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border border-gray-200'
  };

  return (
    <div className={cn(
      "rounded-lg",
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {/* Header */}
      {(title || description || actions) && (
        <div className={cn(
          "flex items-start justify-between",
          padding !== 'none' && "mb-4"
        )}>
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}









