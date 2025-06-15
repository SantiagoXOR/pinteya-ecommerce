"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import Shipping from "./Shipping";
import ShippingMethod from "./ShippingMethod";
import PaymentMethod from "./PaymentMethod";
import Billing from "./Billing";
import OrderSummary from "./OrderSummary";
import Coupon from "./Coupon";
import UserInfo from "./UserInfo";
import { useCheckout } from "@/hooks/useCheckout";

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
  } = useCheckout();

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

  const handlePaymentMethodChange = (method: 'mercadopago' | 'bank' | 'cash') => {
    updateFormData({ paymentMethod: method });
  };

  const handleShippingMethodChange = (method: 'free' | 'express' | 'pickup') => {
    updateFormData({ shippingMethod: method });
  };

  if (step === 'processing') {
    return (
      <>
        <Breadcrumb title={"Checkout"} pages={["checkout"]} />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue mx-auto mb-4"></div>
              <h2 className="text-2xl font-medium text-dark mb-2">Procesando tu pedido...</h2>
              <p className="text-gray-600">Por favor espera mientras preparamos tu pago.</p>
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
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-medium text-dark mb-2">Redirigiendo a MercadoPago...</h2>
              <p className="text-gray-600">Si no eres redirigido automáticamente, por favor espera un momento.</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title={"Checkout"} pages={["checkout"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11">
              {/* Checkout left */}
              <div className="lg:max-w-[670px] w-full">
                {/* Error general */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Error de carrito vacío */}
                {errors.cart && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">{errors.cart}</p>
                  </div>
                )}

                {/* Billing details */}
                <Billing
                  billingData={formData.billing}
                  errors={errors}
                  onBillingChange={updateBillingData}
                />

                {/* Shipping address */}
                <Shipping
                  shippingData={formData.shipping}
                  billingData={formData.billing}
                  errors={errors}
                  onShippingChange={updateShippingData}
                />

                {/* Shipping method */}
                <ShippingMethod
                  selectedMethod={formData.shippingMethod}
                  totalPrice={totalPrice}
                  onMethodChange={handleShippingMethodChange}
                />

                {/* Payment method */}
                <PaymentMethod
                  selectedMethod={formData.paymentMethod}
                  onMethodChange={handlePaymentMethodChange}
                />
              </div>

              {/* Checkout right */}
              <div className="max-w-[455px] w-full">
                {/* User info */}
                <UserInfo className="mb-6" />

                {/* Order summary */}
                <OrderSummary
                  cartItems={cartItems}
                  totalPrice={totalPrice}
                  shippingCost={shippingCost}
                  discount={discount}
                  finalTotal={finalTotal}
                  shippingMethod={formData.shippingMethod}
                  appliedCoupon={appliedCoupon}
                />

                {/* Coupon */}
                <Coupon
                  onCouponApply={applyCoupon}
                  appliedCoupon={appliedCoupon}
                  isLoading={isLoading}
                />

                {/* Checkout button */}
                <button
                  type="submit"
                  disabled={isLoading || cartItems.length === 0}
                  className={`w-full flex justify-center font-medium text-white py-3 px-6 rounded-md ease-out duration-200 mt-7.5 ${
                    isLoading || cartItems.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-tahiti-gold-500 hover:bg-tahiti-gold-700'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </div>
                  ) : (
                    'Procesar Pedido'
                  )}
                </button>

                {/* Terms and conditions */}
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-600">
                    Al hacer clic en &quot;Procesar Pedido&quot;, aceptas nuestros{' '}
                    <a href="/terms" className="text-blue hover:underline">
                      términos y condiciones
                    </a>{' '}
                    y{' '}
                    <a href="/privacy" className="text-blue hover:underline">
                      política de privacidad
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Checkout;
