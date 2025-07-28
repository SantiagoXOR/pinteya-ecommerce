// ===================================
// PINTEYA E-COMMERCE - EXPRESS CHECKOUT
// ===================================

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/hooks/useCheckout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  CreditCard, 
  AlertTriangle, 
  ShoppingCart, 
  Truck, 
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  Star,
  Users,
  Zap,
  Gift,
  MessageCircle
} from "lucide-react";
import { CartSummary } from "@/components/ui/cart-summary";
import MercadoPagoWallet from "./MercadoPagoWallet";
import {
  UrgencyTimer,
  StockIndicator,
  TrustSignals,
  SocialProof,
  PurchaseIncentives,
  ExitIntentModal
} from "./ConversionOptimizer";

// Componente principal
const ExpressCheckout: React.FC = () => {
  const router = useRouter();
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
  });

  const {
    cartItems,
    totalPrice,
    shippingCost,
    discount,
    finalTotal,
    appliedCoupon,
    isLoading,
    errors,
    processCheckout,
    preferenceId,
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  } = useCheckout();

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitIntent]);

  // Redirigir si carrito vacío
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems.length, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.email && formData.phone && formData.address;
  };

  const handleExpressCheckout = async () => {
    if (!isFormValid()) return;
    await processCheckout();
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-4">
              Agrega productos para continuar con el checkout
            </p>
            <Button onClick={() => router.push('/')} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
              Ir a la tienda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Checkout Express</h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4 text-blaze-orange-600" />
                  <span>Carrito</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-blaze-orange-600" />
                  <span>Pago</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span>Confirmación</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open('https://wa.me/5493515551234', '_blank')}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">Ayuda</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Timer de Urgencia */}
        <UrgencyTimer
          initialMinutes={15}
          message="Completa tu compra para mantener el precio y envío gratis"
          variant="warning"
          showProgress={true}
        />

        {/* Trust Signals */}
        <div className="mb-6">
          <TrustSignals />
        </div>

        {/* Social Proof */}
        <div className="mb-6">
          <SocialProof showTestimonials={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Express */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blaze-orange-50 to-yellow-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blaze-orange-700">
                  <Zap className="w-5 h-5" />
                  Checkout Express - Solo 3 datos
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Completa tu compra en menos de 2 minutos
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Errores */}
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800">{errors.general}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blaze-orange-600" />
                    Email para confirmación
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blaze-orange-600" />
                    Teléfono para coordinación
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="11 1234-5678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blaze-orange-600" />
                    Dirección completa
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Calle 123, Ciudad, Provincia"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="h-12 text-lg"
                  />
                  <p className="text-sm text-gray-500">
                    Incluye calle, número, ciudad y provincia
                  </p>
                </div>

                <Separator />

                {/* MercadoPago */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blaze-orange-600" />
                    Método de Pago
                  </h3>
                  
                  {preferenceId ? (
                    <MercadoPagoWallet
                      preferenceId={preferenceId}
                      onReady={handleWalletReady}
                      onError={handleWalletError}
                      onSubmit={handleWalletSubmit}
                    />
                  ) : (
                    <Button
                      onClick={handleExpressCheckout}
                      disabled={!isFormValid() || isLoading}
                      className="w-full h-14 text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          FINALIZAR COMPRA - ${finalTotal.toLocaleString()}
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del Pedido */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stock Indicator */}
              <StockIndicator
                quantity={3}
                lowStockThreshold={5}
                viewers={12}
                recentPurchases={8}
                showSocialProof={true}
              />

              {/* Cart Summary */}
              <CartSummary
                cartItems={cartItems}
                totalPrice={totalPrice}
                shippingCost={shippingCost}
                discount={discount}
                finalTotal={finalTotal}
                shippingMethod="free"
                appliedCoupon={appliedCoupon}
                variant="detailed"
                showProductCards={false}
                productCardContext="checkout"
                className="sticky top-32"
              />

              {/* Purchase Incentives */}
              <PurchaseIncentives />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Trust */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Soporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Devoluciones Gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Garantía de Calidad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Intent Modal */}
      {showExitIntent && (
        <ExitIntentModal
          onClose={() => setShowExitIntent(false)}
          onAccept={() => {
            setShowExitIntent(false);
            // Aplicar descuento del 10%
            // TODO: Implementar lógica de descuento
          }}
          discount={10}
        />
      )}
    </div>
  );
};

export default ExpressCheckout;
