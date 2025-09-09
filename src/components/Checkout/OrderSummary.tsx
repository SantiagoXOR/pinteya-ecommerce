// ===================================
// PINTEYA E-COMMERCE - CHECKOUT ORDER SUMMARY
// ===================================

import React from "react";
import Image from "next/image";
import { CheckoutFormData } from "@/types/checkout";

interface CartItem {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  totalPrice: number;
  shippingCost: number;
  discount: number;
  finalTotal: number;
  shippingMethod: CheckoutFormData['shippingMethod'];
  appliedCoupon?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  totalPrice,
  shippingCost,
  discount,
  finalTotal,
  shippingMethod,
  appliedCoupon,
}) => {
  const getShippingMethodName = (method: CheckoutFormData['shippingMethod']) => {
    switch (method) {
      case 'express':
        return 'Envío Express';
      case 'pickup':
        return 'Retiro en Sucursal';
      case 'free':
      default:
        return 'Envío Estándar';
    }
  };

  return (
    <div className="lg:max-w-[455px] w-full">
      {/* Order list box */}
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Resumen del Pedido</h3>
        </div>

        <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
          {/* Title */}
          <div className="flex items-center justify-between py-5 border-b border-gray-3">
            <div>
              <h4 className="font-medium text-dark">Producto</h4>
            </div>
            <div>
              <h4 className="font-medium text-dark text-right">Subtotal</h4>
            </div>
          </div>

          {/* Product items */}
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-5 border-b border-gray-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-[5px] bg-gray-2 w-12 h-12">
                    <Image
                      src={item.imgs?.thumbnails?.[0] || '/images/placeholder.png'}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="object-cover rounded"
                    />
                  </div>
                  <div>
                    <p className="text-dark font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                  </div>
                </div>
                <div>
                  <p className="text-dark text-right font-medium">
                    ${(item.discountedPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No hay productos en el carrito</p>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between py-4 border-b border-gray-3">
            <div>
              <p className="text-dark">Subtotal</p>
            </div>
            <div>
              <p className="text-dark text-right">${totalPrice.toLocaleString()}</p>
            </div>
          </div>

          {/* Shipping */}
          <div className="flex items-center justify-between py-4 border-b border-gray-3">
            <div>
              <p className="text-dark">Envío</p>
              <p className="text-sm text-gray-600">{getShippingMethodName(shippingMethod)}</p>
            </div>
            <div>
              <p className="text-dark text-right">
                {shippingCost === 0
                  ? 'Gratis'
                  : `$${shippingCost.toLocaleString('es-AR')}`}
              </p>
            </div>
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="flex items-center justify-between py-4 border-b border-gray-3">
              <div>
                <p className="text-dark">Descuento</p>
                {appliedCoupon && (
                  <p className="text-sm text-green-600">Cupón: {appliedCoupon.code}</p>
                )}
              </div>
              <div>
                <p className="text-green-600 text-right font-medium">
                  -${discount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-5">
            <div>
              <p className="font-medium text-lg text-dark">Total</p>
            </div>
            <div>
              <p className="font-medium text-lg text-dark text-right">
                ${finalTotal ? finalTotal.toLocaleString() : '0'}
              </p>
            </div>
          </div>

          {/* Payment info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Información:</strong> Al hacer clic en &quot;Procesar Pedido&quot; serás redirigido
              a MercadoPago para completar el pago de forma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
