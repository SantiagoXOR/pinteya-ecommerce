"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import { selectTotalPrice } from "@/redux/features/cart-slice";

interface FloatingCartButtonProps {
  className?: string;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ 
  className 
}) => {
  const { openCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);
  
  const cartItemCount = cartItems.length;
  const hasCartItems = cartItemCount > 0;

  const handleCartClick = () => {
    openCartModal();
  };

  // En mobile siempre mostrar el botón (incluso sin items para consistencia UX)

  return (
    <Button
      onClick={handleCartClick}
      data-testid="floating-cart-icon"
      className={cn(
        // Posicionamiento flotante - Solo visible en mobile
        "fixed bottom-6 right-6 z-floating sm:hidden",
        // Estilos del botón (similar al ProductCard)
        "bg-yellow-400 hover:bg-yellow-500 text-blaze-orange-600 font-bold",
        "rounded-xl shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-in-out",
        "transform hover:scale-105 active:scale-95",
        // Tamaño y padding
        "h-14 px-6 py-3",
        // Efectos adicionales
        "border-2 border-yellow-500 hover:border-yellow-600",
        "backdrop-blur-sm",
        className
      )}
      style={{ color: '#ea5a17' }}
    >
      <div className="flex items-center gap-3">
        {/* Icono del carrito */}
        <div className="relative">
          <ShoppingCart className="w-6 h-6" style={{ color: '#ea5a17' }} />
          {/* Badge con contador */}
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-fun-green-500 hover:bg-fun-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-badge shadow-sm border border-white">
              {cartItemCount}
            </span>
          )}
        </div>

        {/* Texto y precio */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold leading-none">
            {hasCartItems
              ? `${cartItemCount} ${cartItemCount === 1 ? 'producto' : 'productos'}`
              : 'Carrito'
            }
          </span>
          <span className="text-lg font-black leading-none">
            {hasCartItems ? `$${totalPrice.toLocaleString()}` : 'Vacío'}
          </span>
        </div>
      </div>

      {/* Efecto de pulso para llamar la atención - Solo cuando hay items */}
      {hasCartItems && (
        <div className="absolute inset-0 rounded-xl bg-yellow-400 opacity-75 animate-ping"></div>
      )}
    </Button>
  );
};

export default FloatingCartButton;
