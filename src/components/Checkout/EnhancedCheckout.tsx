// ===================================
// PINTEYA E-COMMERCE - ENHANCED CHECKOUT
// ===================================

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/hooks/useCheckout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  CreditCard, 
  AlertTriangle, 
  ShoppingCart, 
  Truck, 
  CheckCircle,
  User,
  MapPin,
  Shield,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { CartSummary } from "@/components/ui/cart-summary";
import { CheckoutFlow } from "@/components/ui/checkout-flow";
import MercadoPagoWallet, { MercadoPagoWalletFallback } from "./MercadoPagoWallet";
import Billing from "./Billing";
import Shipping from "./Shipping";
import ShippingMethod from "./ShippingMethod";
import PaymentMethod from "./PaymentMethod";

interface EnhancedCheckoutProps {
  variant?: 'default' | 'simplified' | 'express';
  showProgress?: boolean;
  enableStepNavigation?: boolean;
}

const EnhancedCheckout: React.FC<EnhancedCheckoutProps> = ({
  variant = 'default',
  showProgress = true,
  enableStepNavigation = true,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  const {
    formData,
    isLoading,
    errors,
    step,
    cartItems,
    totalPrice,
    shippingCost,
    discount,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    updateBillingData,
    updateShippingData,
    updateFormData,
    processCheckout,
    preferenceId,
    initPoint,
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  } = useCheckout();

  // Definir pasos del checkout
  const checkoutSteps = [
    {
      id: 'contact',
      title: 'Contacto',
      description: 'Información personal',
      icon: User,
      isCompleted: currentStep > 0,
      isActive: currentStep === 0,
    },
    {
      id: 'shipping',
      title: 'Envío',
      description: 'Dirección y método',
      icon: Truck,
      isCompleted: currentStep > 1,
      isActive: currentStep === 1,
    },
    {
      id: 'payment',
      title: 'Pago',
      description: 'Método de pago',
      icon: CreditCard,
      isCompleted: currentStep > 2,
      isActive: currentStep === 2,
    },
  ];

  // Calcular progreso
  const getProgressValue = () => {
    return ((currentStep + 1) / checkoutSteps.length) * 100;
  };

  // Manejar navegación entre pasos
  const handleStepChange = (stepIndex: number) => {
    if (enableStepNavigation) {
      setCurrentStep(stepIndex);
    }
  };

  const handleNextStep = () => {
    if (currentStep < checkoutSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      processCheckout();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validar paso actual
  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Contacto
        return formData.billing.firstName && formData.billing.lastName && formData.billing.email;
      case 1: // Envío
        return formData.billing.streetAddress && formData.billing.city;
      case 2: // Pago
        return formData.paymentMethod;
      default:
        return true;
    }
  };

  // Redirigir si el carrito está vacío
  React.useEffect(() => {
    if (cartItems.length === 0 && step === 'form') {
      router.push('/cart');
    }
  }, [cartItems.length, step, router]);

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="shadow-sm">
            <CardHeader className="bg-blaze-orange-50 border-b">
              <CardTitle className="flex items-center gap-2 text-blaze-orange-700">
                <User className="w-5 h-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Billing
                billingData={formData.billing}
                errors={errors}
                onBillingChange={updateBillingData}
              />
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <MapPin className="w-5 h-5" />
                  Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Shipping
                  shippingData={formData.shipping}
                  billingData={formData.billing}
                  errors={errors}
                  onShippingChange={updateShippingData}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Truck className="w-5 h-5" />
                  Método de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ShippingMethod
                  selectedMethod={formData.shippingMethod}
                  totalPrice={totalPrice}
                  onMethodChange={(method) => updateFormData({ shippingMethod: method })}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-purple-50 border-b">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <CreditCard className="w-5 h-5" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <PaymentMethod
                  selectedMethod={formData.paymentMethod}
                  onMethodChange={(method) => updateFormData({ paymentMethod: method as any })}
                />
              </CardContent>
            </Card>

            {formData.paymentMethod === 'mercadopago' && preferenceId && (
              <MercadoPagoWallet
                preferenceId={preferenceId}
                onReady={handleWalletReady}
                onError={handleWalletError}
                onSubmit={handleWalletSubmit}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (step === 'processing' || step === 'payment' || step === 'redirect') {
    return (
      <section className="overflow-hidden py-8 md:py-20 bg-gray-50">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 xl:px-0">
          <Card className="max-w-md mx-auto shadow-lg">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-blaze-orange-100 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blaze-orange-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                    Procesando tu pedido...
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Por favor espera mientras preparamos tu pago seguro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden py-8 md:py-20 bg-gray-50">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Header con progreso */}
        {showProgress && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Checkout Mejorado
              </h1>
              <Badge variant="secondary" className="bg-blaze-orange-100 text-blaze-orange-700">
                Paso {currentStep + 1} de {checkoutSteps.length}
              </Badge>
            </div>
            <Progress value={getProgressValue()} className="h-3" />
            
            {/* Indicadores de pasos */}
            <div className="flex items-center justify-between mt-4">
              {checkoutSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    enableStepNavigation ? 'hover:text-blaze-orange-600' : ''
                  } ${
                    step.isActive ? 'text-blaze-orange-600' : 
                    step.isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                  onClick={() => handleStepChange(index)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.isActive ? 'bg-blaze-orange-100' :
                    step.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {step.isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            {/* Errores generales */}
            {errors.general && (
              <Card className="border-red-200 bg-red-50 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800">Error en el checkout</h4>
                      <p className="text-sm text-red-700 mt-1">{errors.general}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contenido del paso actual */}
            {renderStepContent()}

            {/* Navegación */}
            <div className="flex items-center justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>

              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!isStepValid() || isLoading}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
              >
                {currentStep === checkoutSteps.length - 1 ? (
                  <>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {isLoading ? 'Procesando...' : 'Finalizar Compra'}
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <CartSummary
              cartItems={cartItems}
              totalPrice={totalPrice}
              shippingCost={shippingCost}
              discount={discount}
              finalTotal={finalTotal}
              shippingMethod={formData.shippingMethod}
              appliedCoupon={appliedCoupon}
              variant="detailed"
              showProductCards={false}
              productCardContext="checkout"
              className="sticky top-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedCheckout;
