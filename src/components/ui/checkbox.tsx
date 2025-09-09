"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "@/lib/optimized-imports"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=checked]:text-white data-[state=checked]:border-primary",
        destructive: "data-[state=checked]:bg-red-600 data-[state=checked]:text-white data-[state=checked]:border-red-600",
        success: "data-[state=checked]:bg-green-600 data-[state=checked]:text-white data-[state=checked]:border-green-600",
        warning: "data-[state=checked]:bg-yellow-600 data-[state=checked]:text-white data-[state=checked]:border-yellow-600",
      },
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, size, label, description, error, indeterminate, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || generatedId
  const hasError = !!error

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          className={cn(
            checkboxVariants({ variant: hasError ? "destructive" : variant, size }),
            hasError && "border-red-500",
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
            {indeterminate ? (
              <Minus className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        
        {(label || description) && (
          <div className="grid gap-1.5 leading-none">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                  hasError && "text-red-600"
                )}
              >
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {description && (
              <p className={cn(
                "text-xs text-gray-600",
                hasError && "text-red-500"
              )}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Checkbox Group para múltiples opciones
export interface CheckboxGroupProps {
  children: React.ReactNode
  label?: string
  description?: string
  error?: string
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function CheckboxGroup({
  children,
  label,
  description,
  error,
  orientation = "vertical",
  className,
}: CheckboxGroupProps) {
  const hasError = !!error

  return (
    <div className={cn("space-y-3", className)}>
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <label className={cn(
              "text-sm font-medium text-gray-900",
              hasError && "text-red-600"
            )}>
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              "text-xs text-gray-600",
              hasError && "text-red-500"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(
        "space-y-2",
        orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0"
      )}>
        {children}
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

// Checkbox con switch style
export interface SwitchCheckboxProps extends CheckboxProps {
  switchStyle?: boolean
}

export const SwitchCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  SwitchCheckboxProps
>(({ className, switchStyle = true, size = "md", ...props }, ref) => {
  if (!switchStyle) {
    return <Checkbox ref={ref} className={className} size={size} {...props} />
  }

  const sizeClasses = {
    sm: "h-4 w-7",
    md: "h-5 w-9", 
    lg: "h-6 w-11",
  }

  const thumbSizeClasses = {
    sm: "h-3 w-3 data-[state=checked]:translate-x-3",
    md: "h-4 w-4 data-[state=checked]:translate-x-4",
    lg: "h-5 w-5 data-[state=checked]:translate-x-5",
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200",
        sizeClasses[size || "md"],
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
          thumbSizeClasses[size || "md"]
        )}
      />
    </CheckboxPrimitive.Root>
  )
})
SwitchCheckbox.displayName = "SwitchCheckbox"

export { Checkbox }
