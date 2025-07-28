"use client";
import React, { useEffect, useState } from "react";

import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import SingleItem from "./SingleItem";
import Link from "next/link";
import EmptyCart from "./EmptyCart";
import ShippingProgressBar from "@/components/ui/shipping-progress-bar";
import Image from "next/image";
import CheckoutTransitionAnimation from "@/components/ui/checkout-transition-animation";
import useCheckoutTransition from "@/hooks/useCheckoutTransition";

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);

  const totalPrice = useSelector(selectTotalPrice);

  // Hook para manejar la animación de transición al checkout
  const {
    isTransitioning,
    startTransition,
    skipAnimation,
    isButtonDisabled,
  } = useCheckoutTransition({
    onTransitionStart: () => {
      // Cerrar el modal con animación de deslizamiento
      closeCartModal();
    },
    onTransitionComplete: () => {
      // La navegación se maneja automáticamente en el componente de animación
    },
  });

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (event.target && !(event.target as Element).closest(".modal-content")) {
        closeCartModal();
      }
    }

    if (isCartModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCartModalOpen, closeCartModal]);

  return (
    <div
      className={`fixed top-0 left-0 z-99999 overflow-y-auto no-scrollbar w-full h-screen bg-dark/70 transition-all duration-500 ease-out ${
        isCartModalOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-center justify-end">
        <div className={`w-full max-w-[500px] shadow-1 bg-white px-4 sm:px-7.5 lg:px-11 relative modal-content transition-transform duration-500 ease-out ${
          isCartModalOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="sticky top-0 bg-white z-20 flex items-center justify-between py-4 border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-2 rounded-full">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: '#ea5a17' }}>
                  🛒 Tu Selección
                </h2>
                <p className="text-xs text-gray-500">
                  {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} listos
                </p>
              </div>
            </div>
            <button
              onClick={() => closeCartModal()}
              aria-label="Cerrar carrito"
              className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
            >
              <svg
                className="w-6 h-6 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
            <div className="flex flex-col gap-4 px-1">
              {/* <!-- cart item --> */}
              {cartItems.length > 0 ? (
                cartItems.map((item: any, key: number) => (
                  <SingleItem key={key} item={item} />
                ))
              ) : (
                <EmptyCart />
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white pt-3 pb-3 mt-4 sticky bottom-0">
            {/* Barra de Progreso Envío Gratis */}
            {cartItems.length > 0 && (
              <div className="mb-3">
                <ShippingProgressBar
                  currentAmount={totalPrice}
                  variant="compact"
                />
              </div>
            )}

            {/* Subtotal */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="font-bold text-lg text-gray-900">Subtotal:</p>
              <p className="font-bold text-lg" style={{ color: '#ea5a17' }}>
                ${totalPrice.toLocaleString()}
              </p>
            </div>

            {/* Información de pago */}
            <div className="space-y-2">
              {/* Línea informativa de MercadoPago - 150px */}
              <div className="w-full flex items-center justify-center gap-2 py-1 px-2 text-sm text-gray-600">
                <Image
                  src="/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg"
                  alt="MercadoPago"
                  width={150}
                  height={48}
                  className="w-auto h-auto max-w-[150px]"
                />
                <span className="font-medium">Pago seguro</span>
              </div>

              {/* Botón principal de checkout */}
              <button
                onClick={startTransition}
                disabled={isButtonDisabled || cartItems.length === 0}
                data-testid="checkout-btn"
                className={`w-full flex justify-center font-bold text-black bg-yellow-400 hover:bg-yellow-500 py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                  isButtonDisabled || cartItems.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                }`}
              >
                {isButtonDisabled ? 'Procesando...' : 'Finalizar Compra'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de animación de transición */}
      <CheckoutTransitionAnimation
        isActive={isTransitioning}
        skipAnimation={skipAnimation}
        onComplete={() => {
          // Callback adicional si es necesario
        }}
      />
    </div>
  );
};

export default CartSidebarModal;
