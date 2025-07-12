"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  // No mostrar el botón si no hay items en el carrito
  if (!hasCartItems) {
    return null;
  }

  return (
    <Button
      onClick={handleCartClick}
      className={cn(
        // Posicionamiento flotante
        "fixed bottom-6 right-6 z-floating",
        // Estilos del botón (similar al ProductCard)
        "bg-yellow-400 hover:bg-yellow-500 text-black font-bold",
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
    >
      <div className="flex items-center gap-3">
        {/* Icono del carrito */}
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {/* Badge con contador */}
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-red-500 hover:bg-red-600"
          >
            {cartItemCount}
          </Badge>
        </div>

        {/* Texto y precio */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold leading-none">
            {cartItemCount} {cartItemCount === 1 ? 'producto' : 'productos'}
          </span>
          <span className="text-lg font-black leading-none">
            ${totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Efecto de pulso para llamar la atención */}
      <div className="absolute inset-0 rounded-xl bg-yellow-400 opacity-75 animate-ping"></div>
    </Button>
  );
};

export default FloatingCartButton;
