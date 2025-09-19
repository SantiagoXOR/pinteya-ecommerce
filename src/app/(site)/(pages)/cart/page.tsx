"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { selectCartItems } from "@/redux/features/cart-slice";

import { Metadata } from "next";

const CartPage = () => {
  const router = useRouter();
  const cartItems = useAppSelector(selectCartItems);

  // ✅ CORREGIDO: Solo redirigir si el carrito está vacío Y no venimos de un checkout
  useEffect(() => {
    // Verificar si venimos de un checkout (referrer contiene /checkout)
    const isFromCheckout = document.referrer.includes('/checkout');

    // También verificar si hay datos de checkout en sessionStorage
    const hasCheckoutSession = sessionStorage.getItem('checkout-in-progress') === 'true';

    console.log('🛒 Cart Page - Verificando redirección:', {
      cartItemsLength: cartItems.length,
      isFromCheckout,
      hasCheckoutSession,
      referrer: document.referrer
    });

    if (cartItems.length === 0 && !isFromCheckout && !hasCheckoutSession) {
      // Solo redirigir si el carrito está vacío y NO venimos de checkout
      console.log('🔄 Cart Page - Redirigiendo a home porque carrito está vacío');
      router.push("/");
    }
  }, [cartItems.length, router]);

  // Si el carrito está vacío y venimos de checkout, mostrar mensaje apropiado
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrito Vacío</h1>
          <p className="text-gray-600 mb-6">
            Tu carrito está vacío. Esto puede ser normal si acabas de completar una compra.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Si hay items en el carrito, redirigir al home donde está el CartSidebarModal
  router.push("/");

  return null;
};

export default CartPage;









