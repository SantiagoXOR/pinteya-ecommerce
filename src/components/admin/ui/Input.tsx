import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/core/utils'
import { LucideIcon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  icon?: LucideIcon
  suffix?: string
  prefix?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    success,
    helperText,
    icon: Icon,
    suffix,
    prefix,
    fullWidth = true,
    disabled,
    ...props
  }, ref) => {
    const hasError = !!error
    const hasSuccess = success && !hasError

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className='block text-sm font-medium text-gray-700'>
            {label}
            {props.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        
        <div className='relative group'>
          {/* Icon Left */}
          {Icon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors'>
              <Icon className='h-5 w-5' />
            </div>
          )}
          
          {/* Prefix */}
          {prefix && (
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium'>
              {prefix}
            </span>
          )}
          
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              
              // States de validación
              hasError && [
                'border-red-300 bg-red-50/50',
                'focus:border-red-500 focus:ring-red-500/20',
                'pr-10'
              ],
              hasSuccess && [
                'border-green-300 bg-green-50/50',
                'focus:border-green-500 focus:ring-green-500/20',
                'pr-10'
              ],
              !hasError && !hasSuccess && [
                'border-gray-300',
                'hover:border-gray-400',
                'focus:border-primary focus:ring-primary/20'
              ],
              
              // Padding adjustments
              Icon && 'pl-10',
              prefix && 'pl-8',
              suffix && 'pr-12',
              
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          
          {/* Validation Icons */}
          {(hasError || hasSuccess) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className='absolute right-3 top-1/2 -translate-y-1/2'
            >
              {hasError && <AlertCircle className='h-5 w-5 text-red-500' />}
              {hasSuccess && <CheckCircle2 className='h-5 w-5 text-green-500' />}
            </motion.div>
          )}
          
          {/* Suffix */}
          {suffix && !hasError && !hasSuccess && (
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium'>
              {suffix}
            </span>
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

Input.displayName = 'Input'

