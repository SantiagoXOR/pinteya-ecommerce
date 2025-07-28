"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import Shipping from "./Shipping";
import ShippingMethod from "./ShippingMethod";
import PaymentMethod from "./PaymentMethod";
import Billing from "./Billing";
import Coupon from "./Coupon";
import UserInfo from "./UserInfo";
import { useCheckout } from "@/hooks/useCheckout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, AlertTriangle, ShoppingCart, Truck, CheckCircle } from "lucide-react";
import MercadoPagoWallet, { MercadoPagoWalletFallback } from "./MercadoPagoWallet";
import { CartSummary } from "@/components/ui/cart-summary";
import { CheckoutFlow } from "@/components/ui/checkout-flow";

const Checkout = () => {
  const router = useRouter();
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
    // ✅ NUEVO: Propiedades para Wallet Brick
    preferenceId,
    initPoint,
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  } = useCheckout();

  // ✅ NUEVO: Pasos del checkout mejorado
  const checkoutSteps = [
    {
      id: 'info',
      title: 'Información',
      description: 'Datos de contacto y envío',
      icon: ShoppingCart,
      isCompleted: step !== 'form',
      isActive: step === 'form',
    },
    {
      id: 'payment',
      title: 'Pago',
      description: 'Método de pago seguro',
      icon: CreditCard,
      isCompleted: step === 'success',
      isActive: step === 'payment',
    },
    {
      id: 'confirmation',
      title: 'Confirmación',
      description: 'Pedido completado',
      icon: CheckCircle,
      isCompleted: step === 'success',
      isActive: step === 'success',
    },
  ];

  // Calcular progreso
  const getProgressValue = () => {
    switch (step) {
      case 'form': return 33;
      case 'processing': return 66;
      case 'payment': return 66;
      case 'redirect': return 90;
      case 'success': return 100;
      default: return 0;
    }
  };

  // Redirigir si el carrito está vacío
  React.useEffect(() => {
    if (cartItems.length === 0 && step === 'form') {
      router.push('/cart');
    }
  }, [cartItems.length, step, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processCheckout();
  };

  const handlePaymentMethodChange = (method: string) => {
    updateFormData({ paymentMethod: method as 'mercadopago' | 'bank' | 'cash' });
  };

  const handleShippingMethodChange = (method: 'free' | 'express' | 'pickup') => {
    updateFormData({ shippingMethod: method });
  };

  if (step === 'processing') {
    return (
      <>
        <Breadcrumb title={"Checkout"} pages={["checkout"]} />
        <section className="overflow-hidden py-8 md:py-20 bg-gray-50">
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 xl:px-0">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <Badge variant="secondary" className="bg-blaze-orange-100 text-blaze-orange-700">
                  Paso 2 de 3
                </Badge>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>

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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blaze-orange-600 h-2 rounded-full animate-pulse" style={{ width: '66%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </>
    );
  }

  // ✅ MEJORADO: Paso de pago con Wallet Brick y Design System
  if (step === 'payment') {
    return (
      <>
        <Breadcrumb title={"Checkout - Pago"} pages={["checkout", "pago"]} />
        <section className="overflow-hidden py-8 md:py-20 bg-gray-50">
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 xl:px-0">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finalizar Pago</h1>
                <Badge variant="secondary" className="bg-blaze-orange-100 text-blaze-orange-700">
                  Paso 3 de 3
                </Badge>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Payment Section */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader className="bg-blaze-orange-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-blaze-orange-700">
                      <CreditCard className="w-5 h-5" />
                      Método de Pago Seguro
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Completa tu compra de forma segura con MercadoPago
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Wallet Brick */}
                    {preferenceId ? (
                      <MercadoPagoWallet
                        preferenceId={preferenceId}
                        onReady={handleWalletReady}
                        onError={handleWalletError}
                        onSubmit={handleWalletSubmit}
                        className="min-h-[400px]"
                      />
                    ) : (
                      // Fallback si no hay preferenceId
                      initPoint && (
                        <MercadoPagoWalletFallback
                          initPoint={initPoint}
                        />
                      )
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
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
      </>
    );
  }

  if (step === 'redirect') {
    return (
      <>
        <Breadcrumb title={"Checkout"} pages={["checkout"]} />
        <section className="overflow-hidden py-8 md:py-20 bg-gray-50">
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 xl:px-0">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  Finalizando...
                </Badge>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>

            <Card className="max-w-md mx-auto shadow-lg">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-yellow-600 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                      Procesando Pago...
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base">
                      Tu pago está siendo procesado. Serás redirigido automáticamente.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando con MercadoPago...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title={"Checkout"} pages={["checkout"]} />
      <section className="overflow-hidden py-8 md:py-20 bg-gray-50">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkout</h1>
              <Badge variant="secondary" className="bg-blaze-orange-100 text-blaze-orange-700">
                Paso 1 de 3
              </Badge>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>

          <form onSubmit={handleSubmit} role="form">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Error general - Mejorado con Design System */}
                {errors.general && (
                  <Card className="border-red-200 bg-red-50">
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

                {/* Error de carrito vacío */}
                {errors.cart && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-yellow-800 font-medium">{errors.cart}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Billing details */}
                <Card className="shadow-sm">
                  <CardHeader className="bg-blaze-orange-50 border-b">
                    <CardTitle className="text-blaze-orange-700">Información de Facturación</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Billing
                      billingData={formData.billing}
                      errors={errors}
                      onBillingChange={updateBillingData}
                    />
                  </CardContent>
                </Card>

                {/* Shipping address */}
                <Card className="shadow-sm">
                  <CardHeader className="bg-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Truck className="w-5 h-5" />
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

                {/* Shipping method */}
                <Card className="shadow-sm">
                  <CardHeader className="bg-green-50 border-b">
                    <CardTitle className="text-green-700">Método de Envío</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ShippingMethod
                      selectedMethod={formData.shippingMethod}
                      totalPrice={totalPrice}
                      onMethodChange={handleShippingMethodChange}
                    />
                  </CardContent>
                </Card>

                {/* Payment method */}
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
                      onMethodChange={handlePaymentMethodChange}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Checkout sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* User info */}
                <Card className="shadow-sm">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-gray-700">Información del Usuario</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <UserInfo />
                  </CardContent>
                </Card>

                {/* Order summary - Usando CartSummary del Design System */}
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

                {/* Coupon */}
                <Card className="shadow-sm">
                  <CardHeader className="bg-yellow-50 border-b">
                    <CardTitle className="text-yellow-700">Cupón de Descuento</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Coupon
                      onCouponApply={applyCoupon}
                      appliedCoupon={appliedCoupon}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>

                {/* Checkout button - Mejorado con Design System */}
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <Button
                      type="submit"
                      disabled={isLoading || cartItems.length === 0}
                      className={`w-full h-12 text-lg font-semibold transition-all duration-200 ${
                        isLoading || cartItems.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Procesar Pedido
                        </div>
                      )}
                    </Button>

                    {/* Terms and conditions */}
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-xs text-gray-600 text-center">
                        Al hacer clic en &quot;Procesar Pedido&quot;, aceptas nuestros{' '}
                        <a href="/terms" className="text-blaze-orange-600 hover:underline font-medium">
                          términos y condiciones
                        </a>{' '}
                        y{' '}
                        <a href="/privacy" className="text-blaze-orange-600 hover:underline font-medium">
                          política de privacidad
                        </a>
                        .
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Checkout;
