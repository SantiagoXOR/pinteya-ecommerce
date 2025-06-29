"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// Progress component inline (simple implementation)
import { Separator } from "@/components/ui/separator"
import { ShippingInfo } from "@/components/ui/shipping-info"
import { CartSummary } from "@/components/ui/cart-summary"
import { 
  CheckCircle, 
  CreditCard, 
  MapPin, 
  Package, 
  Truck, 
  User,
  ArrowLeft,
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckoutStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  isCompleted?: boolean
  isActive?: boolean
  isDisabled?: boolean
}

export interface CheckoutFlowProps {
  /** Paso actual del checkout */
  currentStep: number
  /** Pasos del checkout */
  steps?: CheckoutStep[]
  /** Items del carrito */
  cartItems: any[]
  /** Datos del checkout */
  checkoutData?: {
    totalPrice: number
    shippingCost?: number
    discount?: number
    finalTotal?: number
    shippingMethod?: 'free' | 'standard' | 'express'
    appliedCoupon?: any
  }
  /** Estado de carga */
  isLoading?: boolean
  /** Errores */
  errors?: Record<string, string>
  /** Callback para cambiar paso */
  onStepChange?: (step: number) => void
  /** Callback para continuar */
  onContinue?: () => void
  /** Callback para retroceder */
  onGoBack?: () => void
  /** Callback para finalizar checkout */
  onComplete?: () => void
  /** Mostrar resumen del carrito */
  showCartSummary?: boolean
  /** Variante del componente */
  variant?: 'default' | 'compact' | 'detailed'
  /** Clase CSS adicional */
  className?: string
  /** Contenido personalizado para cada paso */
  children?: React.ReactNode
}

const defaultSteps: CheckoutStep[] = [
  {
    id: 'cart',
    title: 'Carrito',
    description: 'Revisar productos',
    icon: Package,
  },
  {
    id: 'shipping',
    title: 'Envío',
    description: 'Dirección y método',
    icon: Truck,
  },
  {
    id: 'billing',
    title: 'Facturación',
    description: 'Datos personales',
    icon: User,
  },
  {
    id: 'payment',
    title: 'Pago',
    description: 'Método de pago',
    icon: CreditCard,
  },
  {
    id: 'confirmation',
    title: 'Confirmación',
    description: 'Revisar pedido',
    icon: CheckCircle,
  },
]

/**
 * CheckoutFlow avanzado con integración del Design System
 * 
 * Características:
 * - Flujo paso a paso con indicador de progreso
 * - Integra ShippingInfo para opciones de envío
 * - Integra CartSummary para resumen del pedido
 * - Manejo de estados (loading, errores, validación)
 * - Navegación entre pasos
 * - Responsive design
 */
export const CheckoutFlow = React.forwardRef<HTMLDivElement, CheckoutFlowProps>(
  ({
    currentStep = 0,
    steps = defaultSteps,
    cartItems = [],
    checkoutData = {},
    isLoading = false,
    errors = {},
    onStepChange,
    onContinue,
    onGoBack,
    onComplete,
    showCartSummary = true,
    variant = 'default',
    className,
    children,
    ...props
  }, ref) => {
    const isCompact = variant === 'compact'
    const isDetailed = variant === 'detailed'
    
    // Calcular progreso
    const progress = ((currentStep + 1) / steps.length) * 100
    
    // Paso actual
    const activeStep = steps[currentStep]
    
    // Marcar pasos como completados/activos
    const stepsWithStatus = steps.map((step, index) => ({
      ...step,
      isCompleted: index < currentStep,
      isActive: index === currentStep,
      isDisabled: index > currentStep,
    }))

    const handleStepClick = (stepIndex: number) => {
      if (onStepChange && stepIndex <= currentStep) {
        onStepChange(stepIndex)
      }
    }

    const canGoBack = currentStep > 0
    const canContinue = currentStep < steps.length - 1
    const isLastStep = currentStep === steps.length - 1

    return (
      <div ref={ref} className={cn("w-full space-y-6", className)} {...props}>
        {/* Indicador de progreso */}
        {!isCompact && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg">Proceso de Compra</CardTitle>
                <Badge variant="outline">
                  Paso {currentStep + 1} de {steps.length}
                </Badge>
              </div>
              {/* Progress bar simple */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Pasos */}
              <div className="flex items-center justify-between">
                {stepsWithStatus.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex flex-col items-center cursor-pointer transition-colors",
                        step.isActive && "text-primary",
                        step.isCompleted && "text-green-600",
                        step.isDisabled && "text-gray-400 cursor-not-allowed"
                      )}
                      onClick={() => handleStepClick(index)}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-colors",
                          step.isActive && "border-primary bg-primary text-white",
                          step.isCompleted && "border-green-600 bg-green-600 text-white",
                          step.isDisabled && "border-gray-300"
                        )}
                      >
                        {step.isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "text-sm font-medium",
                          step.isActive && "text-primary",
                          step.isCompleted && "text-green-600"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido principal */}
        <div className={cn(
          "grid gap-6",
          showCartSummary ? "lg:grid-cols-3" : "lg:grid-cols-1"
        )}>
          {/* Contenido del paso actual */}
          <div className={cn(showCartSummary ? "lg:col-span-2" : "lg:col-span-1")}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeStep && (
                    <>
                      <activeStep.icon className="w-5 h-5 text-primary" />
                      {activeStep.title}
                    </>
                  )}
                </CardTitle>
                {activeStep?.description && (
                  <p className="text-gray-600">{activeStep.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {/* Errores */}
                {Object.keys(errors).length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Hay errores que corregir:</span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contenido específico del paso */}
                {children}

                {/* Información de envío en el paso correspondiente */}
                {activeStep?.id === 'shipping' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Opciones de Envío</h3>
                    <ShippingInfo
                      variant={isDetailed ? "card" : "default"}
                      options={[
                        {
                          id: 'free',
                          name: 'Envío gratis',
                          price: 0,
                          estimatedDays: { min: 5, max: 7 },
                          isFree: true,
                          description: 'En compras mayores a $50.000'
                        },
                        {
                          id: 'standard',
                          name: 'Envío estándar',
                          price: 2500,
                          estimatedDays: { min: 3, max: 5 },
                          description: 'Entrega a domicilio'
                        },
                        {
                          id: 'express',
                          name: 'Envío express',
                          price: 4500,
                          estimatedDays: { min: 1, max: 2 },
                          isExpress: true,
                          description: 'Entrega prioritaria'
                        }
                      ]}
                      selectedOption={checkoutData.shippingMethod}
                      showCalculator={true}
                      showGuarantees={true}
                    />
                  </div>
                )}

                {/* Navegación */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={onGoBack}
                    disabled={!canGoBack || isLoading}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  {isLastStep ? (
                    <Button
                      onClick={onComplete}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Finalizar Compra
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={onContinue}
                      disabled={!canContinue || isLoading}
                      className="flex items-center gap-2"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del carrito */}
          {showCartSummary && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <CartSummary
                  cartItems={cartItems}
                  totalPrice={checkoutData.totalPrice || 0}
                  shippingCost={checkoutData.shippingCost}
                  discount={checkoutData.discount}
                  finalTotal={checkoutData.finalTotal}
                  shippingMethod={checkoutData.shippingMethod}
                  appliedCoupon={checkoutData.appliedCoupon}
                  variant={isCompact ? "compact" : "default"}
                  showProductCards={isDetailed}
                  productCardContext="checkout"
                  showShippingDetails={activeStep?.id === 'shipping'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

CheckoutFlow.displayName = "CheckoutFlow"
