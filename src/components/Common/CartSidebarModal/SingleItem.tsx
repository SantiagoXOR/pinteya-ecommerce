"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { removeItemFromCart, updateCartItemQuantity } from "@/redux/features/cart-slice";
import { getValidImageUrl } from "@/lib/adapters/product-adapter";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "@/lib/optimized-imports";

const SingleItem = ({ item }: { item: any }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const dispatch = useDispatch<AppDispatch>();

  const handleRemoveFromCart = () => {
    dispatch(removeItemFromCart(item.id));
  };

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
    dispatch(updateCartItemQuantity({ id: item.id, quantity: quantity + 1 }));
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      dispatch(updateCartItemQuantity({ id: item.id, quantity: quantity - 1 }));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200" data-testid="cart-item">
      {/* Product Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={getValidImageUrl(item.imgs?.thumbnails?.[0])}
            alt={item.title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
            {item.title}
          </h3>
          <p className="font-bold text-lg" style={{ color: '#ea5a17' }}>
            ${item.discountedPrice.toLocaleString()}
          </p>
          {item.price && item.discountedPrice && item.discountedPrice < item.price && (
            <p className="text-xs text-gray-500 line-through">
              ${item.price.toLocaleString()}
            </p>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveFromCart}
          aria-label="Eliminar producto del carrito"
          data-testid="remove-from-cart"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-lg border-2 border-yellow-400 bg-white shadow-sm overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecreaseQuantity}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
            className="h-8 w-8 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200"
          >
            <Minus className="w-3 h-3" />
          </Button>

          <div className="flex items-center justify-center w-12 h-8 bg-white font-bold text-sm text-gray-900 border-x-2 border-yellow-400">
            {quantity}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleIncreaseQuantity}
            aria-label="Aumentar cantidad"
            className="h-8 w-8 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Subtotal */}
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: '#ea5a17' }}>
            ${(item.discountedPrice * quantity).toLocaleString()}
          </p>
          {item.price && item.discountedPrice && item.discountedPrice < item.price && (
            <p className="text-xs text-green-600 font-semibold">
              Ahorro: ${((item.price - item.discountedPrice) * quantity).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleItem;









