"use client";

import React from "react";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Palette, Home, Sparkles } from "lucide-react";
import QuickAddSuggestions from "@/components/ui/quick-add-suggestions";

const EmptyCart = () => {
  const { closeCartModal } = useCartModalContext();

  return (
    <div className="text-center py-8 px-4">
      {/* Icono principal */}
      <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
        <ShoppingBag className="w-12 h-12" style={{ color: '#ea5a17' }} />
      </div>

      {/* Título principal */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        ¡Tu carrito está vacío!
      </h3>

      {/* Mensaje motivacional */}
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        Descubre nuestros productos de pinturería y<br />
        comienza a crear algo increíble
      </p>

      {/* Beneficios destacados */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border border-yellow-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-semibold text-gray-700">¿Por qué elegir Pinteya?</span>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Envío gratis desde $15.000</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Pago seguro con MercadoPago</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Productos de calidad profesional</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        {/* Botón principal */}
        <Button
          onClick={() => closeCartModal()}
          asChild
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Link href="/">
            <Palette className="w-5 h-5 mr-2" />
            Explorar Productos
          </Link>
        </Button>

        {/* Botón secundario */}
        <Button
          onClick={() => closeCartModal()}
          asChild
          variant="outline"
          className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-xl transition-all duration-200"
        >
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Ir al Inicio
          </Link>
        </Button>
      </div>

      {/* Mensaje adicional */}
      <p className="text-xs text-gray-500 mt-4 mb-6">
        💡 Tip: Agrega productos a tu carrito para ver el progreso hacia envío gratis
      </p>

      {/* Sugerencias de productos */}
      <QuickAddSuggestions
        onClose={() => closeCartModal()}
        className="mt-6"
      />
    </div>
  );
};

export default EmptyCart;
