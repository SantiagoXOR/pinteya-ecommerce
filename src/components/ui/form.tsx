"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Form Container
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    )
  }
)
Form.displayName = "Form"

// Form Section para agrupar campos relacionados
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  children: React.ReactNode
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

// Form Row para campos en línea
export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: "sm" | "md" | "lg"
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, children, columns = 2, gap = "md", ...props }, ref) => {
    const gapClasses = {
      sm: "gap-2",
      md: "gap-4", 
      lg: "gap-6",
    }

    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormRow.displayName = "FormRow"

// Form Field Container genérico
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  error?: string
  required?: boolean
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, error, required, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormField.displayName = "FormField"

// Form Actions para botones
export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: "left" | "center" | "right" | "between"
  orientation?: "horizontal" | "vertical"
}

const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, children, align = "right", orientation = "horizontal", ...props }, ref) => {
    const alignClasses = {
      left: "justify-start",
      center: "justify-center", 
      right: "justify-end",
      between: "justify-between",
    }

    const orientationClasses = {
      horizontal: "flex flex-row gap-3",
      vertical: "flex flex-col gap-2",
    }

    return (
      <div
        ref={ref}
        className={cn(
          orientationClasses[orientation],
          alignClasses[align],
          "pt-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormActions.displayName = "FormActions"

// Form Message para mostrar mensajes de estado
export interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "info" | "success" | "warning" | "error"
}

const FormMessage = React.forwardRef<HTMLDivElement, FormMessageProps>(
  ({ className, children, variant = "info", ...props }, ref) => {
    const variantClasses = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md border p-4 text-sm",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormMessage.displayName = "FormMessage"

// Hook para manejo de formularios
export interface UseFormOptions<T = Record<string, any>> {
  defaultValues?: T
  onSubmit?: (data: T) => void | Promise<void>
  validate?: (data: T) => Record<string, string> | null
}

export function useForm<T = Record<string, any>>({ defaultValues = {} as T, onSubmit, validate }: UseFormOptions<T> = {}) {
  const [values, setValues] = React.useState<T>(defaultValues)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitCount, setSubmitCount] = React.useState(0)

  const setValue = React.useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const setError = React.useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrors({})
  }, [])

  const reset = React.useCallback((newValues = defaultValues) => {
    setValues(newValues)
    setErrors({})
    setSubmitCount(0)
  }, [defaultValues])

  const handleSubmit = React.useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    setIsSubmitting(true)
    setSubmitCount(prev => prev + 1)
    
    try {
      // Validate if validator is provided
      if (validate) {
        const validationErrors = validate(values)
        if (validationErrors) {
          setErrors(validationErrors)
          return
        }
      }
      
      // Clear errors and submit
      setErrors({})
      await onSubmit?.(values)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  return {
    values,
    errors,
    isSubmitting,
    submitCount,
    setValue,
    setError,
    clearErrors,
    reset,
    handleSubmit,
    register: (name: string) => ({
      value: (values as any)[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(name, e.target.value)
      },
      error: errors[name],
    }),
  }
}

// Componente de ejemplo para formulario de contacto
export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  acceptTerms: boolean
}

export interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void | Promise<void>
  className?: string
}

export function ContactForm({ onSubmit, className }: ContactFormProps) {
  const { values, errors, isSubmitting, handleSubmit, register } = useForm<ContactFormData>({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      acceptTerms: false,
    },
    onSubmit,
    validate: (data) => {
      const errors: Record<string, string> = {}
      
      if (!data.name?.trim()) errors.name = 'El nombre es requerido'
      if (!data.email?.trim()) errors.email = 'El email es requerido'
      else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Email inválido'
      if (!data.subject?.trim()) errors.subject = 'El asunto es requerido'
      if (!data.message?.trim()) errors.message = 'El mensaje es requerido'
      if (!data.acceptTerms) errors.acceptTerms = 'Debes aceptar los términos'
      
      return Object.keys(errors).length > 0 ? errors : null
    },
  })

  return (
    <Form onSubmit={handleSubmit} className={className}>
      <FormSection
        title="Formulario de Contacto"
        description="Completa el formulario y nos pondremos en contacto contigo"
      >
        <FormRow columns={2}>
          <FormField>
            {/* Aquí irían los componentes Input, etc. */}
            <p className="text-sm text-gray-600">
              Componentes Input, Select, Textarea, etc. se integrarían aquí
            </p>
          </FormField>
        </FormRow>
        
        <FormActions>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </button>
        </FormActions>
      </FormSection>
    </Form>
  )
}

export {
  Form,
  FormSection,
  FormRow,
  FormField,
  FormActions,
  FormMessage,
}
