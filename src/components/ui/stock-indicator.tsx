"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Package, AlertTriangle, XCircle, Check } from "lucide-react";

const stockIndicatorVariants = cva(
  "flex items-center gap-2 text-sm font-medium",
  {
    variants: {
      variant: {
        default: "flex-row",
        compact: "flex-row gap-1",
        badge: "inline-flex px-2 py-1 rounded-full text-xs",
        minimal: "flex-row gap-1 text-xs",
      },
      status: {
        inStock: "text-green-600",
        lowStock: "text-yellow-600",
        outOfStock: "text-red-600",
        preOrder: "text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
      status: "inStock",
    },
  }
)

export interface StockIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stockIndicatorVariants> {
  /** Cantidad disponible en stock */
  quantity: number
  /** Umbral para considerar stock bajo */
  lowStockThreshold?: number
  /** Mostrar cantidad exacta */
  showExactQuantity?: boolean
  /** Texto personalizado para diferentes estados */
  customTexts?: {
    inStock?: string
    lowStock?: string
    outOfStock?: string
    preOrder?: string
  }
  /** Mostrar ícono */
  showIcon?: boolean
  /** Permitir pre-orden cuando no hay stock */
  allowPreOrder?: boolean
  /** Tiempo estimado de reposición */
  restockDate?: Date
  /** Unidad de medida (ej: "unidades", "litros", "kg") */
  unit?: string
}

/**
 * Determina el estado del stock basado en la cantidad
 */
const getStockStatus = (
  quantity: number, 
  lowStockThreshold: number = 5,
  allowPreOrder: boolean = false
): "inStock" | "lowStock" | "outOfStock" | "preOrder" => {
  if (quantity === 0) {
    return allowPreOrder ? "preOrder" : "outOfStock"
  }
  if (quantity <= lowStockThreshold) {
    return "lowStock"
  }
  return "inStock"
}

/**
 * Obtiene el ícono apropiado para cada estado
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case "inStock":
      return <Check className="w-4 h-4" />
    case "lowStock":
      return <AlertTriangle className="w-4 h-4" />
    case "outOfStock":
      return <XCircle className="w-4 h-4" />
    case "preOrder":
      return <Package className="w-4 h-4" />
    default:
      return <Check className="w-4 h-4" />
  }
}

/**
 * Obtiene el texto por defecto para cada estado
 */
const getDefaultText = (
  status: string,
  quantity: number,
  showExactQuantity: boolean,
  unit: string = "unidades"
): string => {
  switch (status) {
    case "inStock":
      return showExactQuantity 
        ? `${quantity} ${unit} disponibles`
        : "En stock"
    case "lowStock":
      return showExactQuantity 
        ? `¡Solo ${quantity} ${unit} disponibles!`
        : "Pocas unidades"
    case "outOfStock":
      return "Sin stock"
    case "preOrder":
      return "Disponible por encargo"
    default:
      return "En stock"
  }
}

/**
 * Formatea la fecha de reposición
 */
const formatRestockDate = (date: Date): string => {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) {
    return "Disponible pronto"
  } else if (diffDays === 1) {
    return "Disponible mañana"
  } else if (diffDays <= 7) {
    return `Disponible en ${diffDays} días`
  } else {
    return `Disponible el ${date.toLocaleDateString('es-AR')}`
  }
}

const StockIndicator = React.forwardRef<HTMLDivElement, StockIndicatorProps>(
  ({ 
    className, 
    variant, 
    quantity,
    lowStockThreshold = 5,
    showExactQuantity = false,
    customTexts = {},
    showIcon = true,
    allowPreOrder = false,
    restockDate,
    unit = "unidades",
    ...props 
  }, ref) => {
    const status = getStockStatus(quantity, lowStockThreshold, allowPreOrder)
    
    const statusText = customTexts[status] || getDefaultText(
      status, 
      quantity, 
      showExactQuantity, 
      unit
    )

    return (
      <div
        ref={ref}
        className={cn(stockIndicatorVariants({ variant, status, className }))}
        {...props}
      >
        {/* Ícono de estado */}
        {showIcon && getStatusIcon(status)}
        
        {/* Texto principal */}
        <span>{statusText}</span>
        
        {/* Información de reposición */}
        {status === "outOfStock" && restockDate && (
          <span className="text-xs text-muted-foreground ml-1">
            ({formatRestockDate(restockDate)})
          </span>
        )}
        
        {/* Badge de estado para variante badge */}
        {variant === "badge" && (
          <div className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full",
            {
              "bg-green-500": status === "inStock",
              "bg-yellow-500": status === "lowStock", 
              "bg-red-500": status === "outOfStock",
              "bg-blue-500": status === "preOrder",
            }
          )} />
        )}
      </div>
    )
  }
)

StockIndicator.displayName = "StockIndicator"

export { StockIndicator, stockIndicatorVariants }









