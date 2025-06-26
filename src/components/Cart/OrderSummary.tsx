import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import React from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShoppingCart, CreditCard } from "lucide-react";

const OrderSummary = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);

  // Calcular envío
  const shippingCost = totalPrice >= 15000 ? 0 : 2500;
  const finalTotal = totalPrice + shippingCost;

  return (
    <div className="lg:max-w-[455px] w-full">
      {/* <!-- order list box --> */}
      <Card className="border-0 shadow-2">
        <div className="border-b border-gray-200 py-6 px-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-xl text-gray-900">Resumen del Pedido</h3>
            <Badge variant="outline" size="sm">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          {/* <!-- title --> */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Producto</h4>
            <h4 className="font-semibold text-gray-900">Subtotal</h4>
          </div>

          {/* <!-- product items --> */}
          <div className="max-h-60 overflow-y-auto">
            {cartItems.map((item, key) => (
              <div key={key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 pr-4">
                  <p className="text-gray-900 font-medium line-clamp-2">{item.title}</p>
                  <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${(item.discountedPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* <!-- calculations --> */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-semibold text-gray-900">${totalPrice.toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-gray-600">Envío</p>
                {shippingCost === 0 && (
                  <Badge variant="success" size="sm">Gratis</Badge>
                )}
              </div>
              <p className="font-semibold text-gray-900">
                {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
              </p>
            </div>

            {shippingCost === 0 && (
              <p className="text-sm text-success">
                ¡Felicitaciones! Tu compra califica para envío gratis
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <p className="font-bold text-lg text-gray-900">Total</p>
              <p className="font-bold text-xl text-primary">${finalTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* <!-- checkout button --> */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Proceder al Checkout
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OrderSummary;
