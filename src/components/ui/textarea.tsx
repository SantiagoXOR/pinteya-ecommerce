'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:border-primary focus-visible:ring-primary/20',
        error: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20',
        success: 'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20',
      },
      size: {
        sm: 'min-h-[60px] px-2 py-1 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[100px] px-4 py-3 text-base',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      resize: 'vertical',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string
  description?: string
  error?: string
  helperText?: string
  maxLength?: number
  showCharCount?: boolean
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
      label,
      description,
      error,
      helperText,
      maxLength,
      showCharCount = false,
      autoResize = false,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const textareaId = id || generatedId
    const hasError = !!error
    const finalVariant = hasError ? 'error' : variant
    const [charCount, setCharCount] = React.useState(0)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Combinar refs
    React.useImperativeHandle(ref, () => textareaRef.current!)

    // Auto resize functionality
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea && autoResize) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [autoResize])

    // Handle change with character count
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value

      // Enforce max length
      if (maxLength && newValue.length > maxLength) {
        return
      }

      setCharCount(newValue.length)

      if (autoResize) {
        adjustHeight()
      }

      onChange?.(e)
    }

    // Initialize character count
    React.useEffect(() => {
      if (value) {
        setCharCount(String(value).length)
      }
    }, [value])

    // Adjust height on mount if autoResize is enabled
    React.useEffect(() => {
      if (autoResize) {
        adjustHeight()
      }
    }, [adjustHeight, autoResize])

    return (
      <div className='w-full space-y-2'>
        {(label || description) && (
          <div className='space-y-1'>
            {label && (
              <label
                htmlFor={textareaId}
                className={cn(
                  'block text-sm font-medium text-gray-700',
                  hasError && 'text-red-600'
                )}
              >
                {label}
                {props.required && <span className='text-red-500 ml-1'>*</span>}
              </label>
            )}
            {description && (
              <p className={cn('text-xs text-gray-600', hasError && 'text-red-500')}>
                {description}
              </p>
            )}
          </div>
        )}

        <div className='relative'>
          <textarea
            ref={textareaRef}
            id={textareaId}
            className={cn(
              textareaVariants({ variant: finalVariant, size, resize }),
              autoResize && 'overflow-hidden',
              className
            )}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />

          {(showCharCount || maxLength) && (
            <div className='absolute bottom-2 right-2 text-xs text-gray-500'>
              {showCharCount && (
                <span
                  className={cn(
                    maxLength && charCount > maxLength * 0.9 && 'text-yellow-600',
                    maxLength && charCount === maxLength && 'text-red-600'
                  )}
                >
                  {charCount}
                  {maxLength && `/${maxLength}`}
                </span>
              )}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className='space-y-1'>
            {error && (
              <p className='text-xs text-red-600'>
                {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
              </p>
            )}
            {helperText && !error && <p className='text-xs text-gray-600'>{helperText}</p>}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// Textarea específico para comentarios/reviews
export interface ReviewTextareaProps extends Omit<TextareaProps, 'placeholder' | 'maxLength'> {
  productName?: string
}

export const ReviewTextarea = React.forwardRef<HTMLTextAreaElement, ReviewTextareaProps>(
  ({ productName, label, ...props }, ref) => {
    const defaultLabel = productName
      ? `Escribe tu reseña sobre ${productName}`
      : 'Escribe tu reseña'

    return (
      <Textarea
        ref={ref}
        label={label || defaultLabel}
        placeholder='Comparte tu experiencia con este producto. ¿Qué te gustó? ¿Lo recomendarías?'
        maxLength={500}
        showCharCount
        autoResize
        size='lg'
        {...props}
      />
    )
  }
)
ReviewTextarea.displayName = 'ReviewTextarea'

// Textarea para consultas de productos
export interface ProductInquiryTextareaProps extends Omit<TextareaProps, 'placeholder' | 'label'> {
  productName?: string
}

export const ProductInquiryTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ProductInquiryTextareaProps
>(({ productName, ...props }, ref) => {
  const placeholder = productName
    ? `Haz tu consulta sobre ${productName}...`
    : 'Escribe tu consulta sobre este producto...'

  return (
    <Textarea
      ref={ref}
      label='Tu consulta'
      placeholder={placeholder}
      description='Nuestro equipo te responderá a la brevedad'
      maxLength={300}
      showCharCount
      {...props}
    />
  )
})
ProductInquiryTextarea.displayName = 'ProductInquiryTextarea'

export { Textarea }
