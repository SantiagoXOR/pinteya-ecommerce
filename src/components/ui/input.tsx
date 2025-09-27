import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-md border bg-white px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-gray-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
        error:
          'border-error focus-visible:border-error focus-visible:ring-2 focus-visible:ring-error/20',
        success:
          'border-success focus-visible:border-success focus-visible:ring-2 focus-visible:ring-success/20',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const hasError = !!error
    const finalVariant = hasError ? 'error' : variant

    return (
      <div className='w-full'>
        {label && (
          <label htmlFor={inputId} className='block text-sm font-medium text-gray-700 mb-2'>
            {label}
            {props.required && <span className='text-error ml-1'>*</span>}
          </label>
        )}

        <div className='relative'>
          {leftIcon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>{leftIcon}</div>
          )}

          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            id={inputId}
            {...props}
          />

          {rightIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400',
                onRightIconClick && 'cursor-pointer hover:text-gray-600'
              )}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p className={cn('mt-1 text-xs', error ? 'text-error' : 'text-gray-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
