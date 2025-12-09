import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/core/utils'
import { AlertCircle, CheckCircle2 } from '@/lib/optimized-imports'
import { motion, AnimatePresence } from 'framer-motion'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  fullWidth?: boolean
  showCount?: boolean
  maxLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    success,
    helperText,
    fullWidth = true,
    disabled,
    showCount,
    maxLength,
    value,
    ...props
  }, ref) => {
    const hasError = !!error
    const hasSuccess = success && !hasError
    const currentLength = value?.toString().length || 0

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        <div className='flex items-center justify-between'>
          {label && (
            <label className='block text-sm font-medium text-gray-700'>
              {label}
              {props.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className={cn(
              'text-xs',
              currentLength > maxLength ? 'text-red-500' : 'text-gray-400'
            )}>
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        
        <div className='relative group'>
          <textarea
            className={cn(
              'flex min-h-[100px] w-full rounded-lg border bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'transition-all duration-200 resize-y',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              
              // States de validación
              hasError && [
                'border-red-300 bg-red-50/50',
                'focus:border-red-500 focus:ring-red-500/20',
              ],
              hasSuccess && [
                'border-green-300 bg-green-50/50',
                'focus:border-green-500 focus:ring-green-500/20',
              ],
              !hasError && !hasSuccess && [
                'border-gray-300',
                'hover:border-gray-400',
                'focus:border-primary focus:ring-primary/20'
              ],
              
              className
            )}
            ref={ref}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            {...props}
          />
          
          {/* Validation Icon */}
          {(hasError || hasSuccess) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className='absolute right-3 top-3'
            >
              {hasError && <AlertCircle className='h-5 w-5 text-red-500' />}
              {hasSuccess && <CheckCircle2 className='h-5 w-5 text-green-500' />}
            </motion.div>
          )}
        </div>
        
        {/* Helper Text / Error Message */}
        <AnimatePresence mode="wait">
          {(error || helperText) && (
            <motion.p
              key={error ? 'error' : 'helper'}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm flex items-center gap-1.5',
                error ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {error && <AlertCircle className='h-3.5 w-3.5' />}
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

