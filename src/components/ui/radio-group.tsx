'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from '@/lib/optimized-imports'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const radioGroupVariants = cva('grid gap-2', {
  variants: {
    orientation: {
      vertical: 'grid-cols-1',
      horizontal: 'grid-flow-col auto-cols-max gap-4',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

const radioItemVariants = cva(
  'aspect-square h-4 w-4 rounded-full border border-gray-300 text-primary ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        destructive: 'data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600',
        success: 'data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600',
        warning: 'data-[state=checked]:border-yellow-600 data-[state=checked]:bg-yellow-600',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface RadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, 'orientation'>,
    VariantProps<typeof radioGroupVariants> {
  label?: string
  description?: string
  error?: string
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation, label, description, error, children, ...props }, ref) => {
  const hasError = !!error

  return (
    <div className='space-y-3'>
      {(label || description) && (
        <div className='space-y-1'>
          {label && (
            <label className={cn('text-sm font-medium text-gray-900', hasError && 'text-red-600')}>
              {label}
              {props.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
          )}
          {description && (
            <p className={cn('text-xs text-gray-600', hasError && 'text-red-500')}>{description}</p>
          )}
        </div>
      )}

      <RadioGroupPrimitive.Root
        className={cn(radioGroupVariants({ orientation }), className)}
        {...props}
        ref={ref}
      >
        {children}
      </RadioGroupPrimitive.Root>

      {error && (
        <p className='text-xs text-red-600'>
          {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
        </p>
      )}
    </div>
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {
  label?: string
  description?: string
  id?: string
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, size, label, description, id, ...props }, ref) => {
  const generatedId = React.useId()
  const itemId = id || generatedId

  return (
    <div className='flex items-start space-x-2'>
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={cn(radioItemVariants({ variant, size }), className)}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className='flex items-center justify-center'>
          <Circle className='h-2.5 w-2.5 fill-current text-white' />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>

      {(label || description) && (
        <div className='grid gap-1.5 leading-none'>
          {label && (
            <label
              htmlFor={itemId}
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
            >
              {label}
            </label>
          )}
          {description && <p className='text-xs text-gray-600'>{description}</p>}
        </div>
      )}
    </div>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Radio Group con cards para mejor UX en e-commerce
export interface RadioCardProps extends RadioGroupItemProps {
  icon?: React.ReactNode
  price?: string
  badge?: string
  disabled?: boolean
}

const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(({ className, label, description, icon, price, badge, disabled, id, ...props }, ref) => {
  const generatedId = React.useId()
  const itemId = id || generatedId

  return (
    <div className='relative'>
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={cn('peer sr-only', disabled && 'cursor-not-allowed')}
        disabled={disabled}
        {...props}
      />
      <label
        htmlFor={itemId}
        className={cn(
          'flex cursor-pointer select-none items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-200',
          'hover:border-primary/50 hover:bg-primary/5',
          'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className='flex items-center space-x-3'>
          {icon && (
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600'>
              {icon}
            </div>
          )}
          <div className='space-y-1'>
            {label && <p className='text-sm font-medium text-gray-900'>{label}</p>}
            {description && <p className='text-xs text-gray-600'>{description}</p>}
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          {price && <span className='text-sm font-semibold text-primary'>{price}</span>}
          {badge && (
            <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
              {badge}
            </span>
          )}
          <div className='flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary'>
            <div className='h-2 w-2 rounded-full bg-white opacity-0 peer-data-[state=checked]:opacity-100' />
          </div>
        </div>
      </label>
    </div>
  )
})
RadioCard.displayName = 'RadioCard'

// Componente específico para métodos de envío
export interface ShippingMethodProps {
  methods: Array<{
    id: string
    name: string
    description?: string
    price: string
    estimatedDays?: string
    icon?: React.ReactNode
    badge?: string
  }>
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  error?: string
}

export function ShippingMethodRadio({
  methods,
  value,
  onValueChange,
  label = 'Método de envío',
  error,
}: ShippingMethodProps) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} label={label} error={error}>
      {methods.map(method => (
        <RadioCard
          key={method.id}
          value={method.id}
          label={method.name}
          description={method.description}
          price={method.price}
          badge={method.badge}
          icon={method.icon}
        />
      ))}
    </RadioGroup>
  )
}

// Componente específico para métodos de pago
export interface PaymentMethodProps {
  methods: Array<{
    id: string
    name: string
    description?: string
    icon?: React.ReactNode
    badge?: string
    disabled?: boolean
  }>
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  error?: string
}

export function PaymentMethodRadio({
  methods,
  value,
  onValueChange,
  label = 'Método de pago',
  error,
}: PaymentMethodProps) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} label={label} error={error}>
      {methods.map(method => (
        <RadioCard
          key={method.id}
          value={method.id}
          label={method.name}
          description={method.description}
          badge={method.badge}
          icon={method.icon}
          disabled={method.disabled}
        />
      ))}
    </RadioGroup>
  )
}

export { RadioGroup, RadioGroupItem, RadioCard }
