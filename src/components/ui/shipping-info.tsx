"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Truck, Clock, MapPin, Star, Shield } from "lucide-react"

const shippingInfoVariants = cva(
  "flex items-center gap-2 text-sm",
  {
    variants: {
      variant: {
        default: "flex-col items-start gap-2",
        inline: "flex-row items-center gap-2",
        badge: "inline-flex px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200",
        card: "flex-col p-3 border rounded-lg bg-background",
      },
      type: {
        free: "text-green-600",
        fast: "text-blue-600", 
        standard: "text-gray-600",
        express: "text-purple-600",
        pickup: "text-orange-600",
      },
    },
    defaultVariants: {
      variant: "default",
      type: "standard",
    },
  }
)

export interface ShippingOption {
  id: string
  name: string
  price: number
  estimatedDays: {
    min: number
    max: number
  }
  isFree?: boolean
  isExpress?: boolean
  description?: string
}

export interface ShippingInfoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof shippingInfoVariants> {
  /** Opciones de envío disponibles */
  options?: ShippingOption[]
  /** Opción seleccionada */
  selectedOption?: string
  /** Mostrar envío gratis destacado */
  highlightFreeShipping?: boolean
  /** Código postal para calcular envío */
  postalCode?: string
  /** Callback cuando se selecciona una opción */
  onOptionSelect?: (optionId: string) => void
  /** Mostrar calculadora de envío */
  showCalculator?: boolean
  /** Peso del producto para cálculo */
  productWeight?: number
  /** Dimensiones del producto */
  productDimensions?: {
    length: number
    width: number
    height: number
  }
  /** Mostrar garantías de envío */
  showGuarantees?: boolean
}

/**
 * Formatea el rango de días de entrega
 */
const formatDeliveryTime = (min: number, max: number): string => {
  if (min === max) {
    return min === 1 ? "1 día hábil" : `${min} días hábiles`
  }
  return `${min}-${max} días hábiles`
}

/**
 * Formatea el precio de envío
 */
const formatShippingPrice = (price: number, isFree: boolean = false): string => {
  if (isFree || price === 0) {
    return "Gratis"
  }
  return (price / 100).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  })
}

/**
 * Obtiene el ícono apropiado para cada tipo de envío
 */
const getShippingIcon = (type: string, isExpress: boolean = false) => {
  if (isExpress) {return <Star className="w-4 h-4" />}
  
  switch (type) {
    case "free":
      return <Truck className="w-4 h-4" />
    case "fast":
    case "express":
      return <Clock className="w-4 h-4" />
    case "pickup":
      return <MapPin className="w-4 h-4" />
    default:
      return <Truck className="w-4 h-4" />
  }
}

const ShippingInfo = React.forwardRef<HTMLDivElement, ShippingInfoProps>(
  ({ 
    className, 
    variant, 
    type,
    options = [],
    selectedOption,
    highlightFreeShipping = true,
    postalCode,
    onOptionSelect,
    showCalculator = false,
    productWeight,
    productDimensions,
    showGuarantees = false,
    ...props 
  }, ref) => {
    const [calculatorOpen, setCalculatorOpen] = React.useState(false)
    const [inputPostalCode, setInputPostalCode] = React.useState(postalCode || "")

    // Opción de envío gratis por defecto si no hay opciones
    const defaultFreeOption: ShippingOption = {
      id: "free",
      name: "Envío gratis",
      price: 0,
      estimatedDays: { min: 3, max: 5 },
      isFree: true,
      description: "En compras mayores a $50.000"
    }

    const shippingOptions = options.length > 0 ? options : [defaultFreeOption]
    const freeOptions = shippingOptions.filter(option => option.isFree || option.price === 0)

    return (
      <div
        ref={ref}
        className={cn(shippingInfoVariants({ variant, type, className }))}
        {...props}
      >
        {/* Envío gratis destacado */}
        {highlightFreeShipping && freeOptions.length > 0 && variant !== "card" && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <Truck className="w-4 h-4" />
            <span>🚚 Envío gratis</span>
            {freeOptions[0].description && (
              <span className="text-xs text-muted-foreground">
                {freeOptions[0].description}
              </span>
            )}
          </div>
        )}

        {/* Lista de opciones de envío */}
        {variant === "card" && (
          <div className="space-y-3 w-full">
            <h4 className="font-medium text-base">Opciones de envío</h4>
            
            {shippingOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                  selectedOption === option.id 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => onOptionSelect?.(option.id)}
              >
                <div className="flex items-center gap-3">
                  {getShippingIcon(option.id, option.isExpress)}
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDeliveryTime(option.estimatedDays.min, option.estimatedDays.max)}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-medium">
                  {formatShippingPrice(option.price, option.isFree)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calculadora de envío */}
        {showCalculator && (
          <div className="space-y-2 w-full">
            <button
              onClick={() => setCalculatorOpen(!calculatorOpen)}
              className="text-sm text-primary hover:underline"
            >
              Calcular costo de envío
            </button>
            
            {calculatorOpen && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código postal"
                  value={inputPostalCode}
                  onChange={(e) => setInputPostalCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <button className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90">
                  Calcular
                </button>
              </div>
            )}
          </div>
        )}

        {/* Garantías de envío */}
        {showGuarantees && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Envío protegido</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Entrega garantizada</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ShippingInfo.displayName = "ShippingInfo"

export { ShippingInfo, shippingInfoVariants }









