"use client";
import React, { useState } from "react";
import Discount from "./Discount";
import OrderSummary from "./OrderSummary";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { removeAllItemsFromCart } from "@/redux/features/cart-slice";
import { clearCartFromStorage } from "@/redux/middleware/cartPersistence";
import SingleItem from "./SingleItem";
import Breadcrumb from "../Common/Breadcrumb";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/modal";
import { ShoppingBag, Trash2, ArrowLeft, Sparkles, Palette } from "@/lib/optimized-imports";

const Cart = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const dispatch = useAppDispatch();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCart = () => {
    dispatch(removeAllItemsFromCart());
    clearCartFromStorage();
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* <!-- ===== Breadcrumb Section Start ===== --> */}
      <section>
        <Breadcrumb title={"Cart"} pages={["Cart"]} />
      </section>
      {/* <!-- ===== Breadcrumb Section End ===== --> */}
      {cartItems.length > 0 ? (
        <section className="overflow-hidden py-20 bg-gray-50">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="flex flex-wrap items-center justify-between gap-5 mb-8">
              <div className="flex items-center gap-3">
                <h1 className="font-bold text-gray-900 text-3xl">Tu Carrito</h1>
                <Badge variant="outline" size="lg">
                  {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                </Badge>
              </div>
              <Button
                variant="destructive"
                size="md"
                className="gap-2"
                onClick={() => setShowClearConfirm(true)}
                data-testid="clear-cart-btn"
              >
                <Trash2 className="w-4 h-4" />
                Vaciar Carrito
              </Button>
            </div>

            <Card className="border-0 shadow-2">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1170px]">
                  {/* <!-- table header --> */}
                  <div className="flex items-center py-6 px-8 bg-gray-50 border-b border-gray-200">
                    <div className="min-w-[400px]">
                      <p className="font-semibold text-gray-900">Producto</p>
                    </div>

                    <div className="min-w-[180px]">
                      <p className="font-semibold text-gray-900">Precio</p>
                    </div>

                    <div className="min-w-[275px]">
                      <p className="font-semibold text-gray-900">Cantidad</p>
                    </div>

                    <div className="min-w-[200px]">
                      <p className="font-semibold text-gray-900">Subtotal</p>
                    </div>

                    <div className="min-w-[50px]">
                      <p className="font-semibold text-gray-900 text-right">Acción</p>
                    </div>
                  </div>

                  {/* <!-- cart item --> */}
                  {cartItems.length > 0 &&
                    cartItems.map((item: any, key: number) => (
                      <SingleItem item={item} key={key} />
                    ))}
                </div>
              </div>
            </Card>

            <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11 mt-9">
              <Discount />
              <OrderSummary />
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 bg-gray-50">
          <div className="max-w-[600px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <Card className="text-center p-12 border-0 shadow-2">
              <div className="mx-auto mb-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12" style={{ color: '#ea5a17' }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  ¡Tu carrito está vacío!
                </h2>
                <p className="text-gray-600 mb-8">
                  Descubre nuestros productos de pinturería profesional<br />
                  y comienza a crear algo increíble
                </p>
              </div>

              {/* Beneficios destacados */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-8 border border-yellow-200">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-700">Beneficios Pinteya</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Envío gratis desde $15.000</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Pago seguro con MercadoPago</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Productos profesionales</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  asChild
                >
                  <Link href="/">
                    <Palette className="w-5 h-5 mr-2" />
                    Explorar Productos
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                  asChild
                >
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Modal de confirmación para vaciar carrito */}
      <ConfirmModal
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="¿Vaciar carrito?"
        description={`¿Estás seguro de que quieres eliminar ${cartItems.length === 1 ? 'el producto' : `los ${cartItems.length} productos`} del carrito? Esta acción no se puede deshacer.`}
        variant="destructive"
        confirmText="Sí, vaciar carrito"
        cancelText="Cancelar"
        onConfirm={handleClearCart}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
};

export default Cart;
