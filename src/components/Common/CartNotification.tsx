"use client";

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/redux/store';
import { ShoppingCart, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartModalContext } from '@/app/context/CartSidebarModalContext';
import Image from 'next/image';

interface CartNotificationProps {
  show: boolean;
  productName?: string;
  productImage?: string;
  onClose?: () => void;
}

const CartNotification: React.FC<CartNotificationProps> = ({
  show,
  productName,
  productImage,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { openCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide después de 4 segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
    // Return undefined cuando show es false
    return undefined;
  }, [show, onClose]);

  const handleViewCart = () => {
    openCartModal();
    setIsVisible(false);
    onClose?.();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!show || !isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-notification animate-slide-in-right">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-semibold text-gray-900">¡Agregado al carrito!</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Info */}
        {(productName || productImage) && (
          <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg">
            {productImage && (
              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={productImage}
                  alt={productName || 'Producto'}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {productName && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {productName}
                </p>
                <p className="text-xs text-gray-500">
                  Cantidad en carrito: {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="flex-1"
          >
            Seguir comprando
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleViewCart}
            className="flex-1 flex items-center gap-1"
          >
            <ShoppingCart className="w-4 h-4" />
            Ver carrito
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full animate-pulse"
              style={{ 
                width: '100%',
                animation: 'progress 4s linear forwards'
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Hook para manejar las notificaciones del carrito
export const useCartNotification = () => {
  const [notification, setNotification] = useState<{
    show: boolean;
    productName?: string;
    productImage?: string;
  }>({
    show: false
  });

  const showNotification = (productName?: string, productImage?: string) => {
    setNotification({
      show: true,
      productName,
      productImage
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
};

export default CartNotification;
