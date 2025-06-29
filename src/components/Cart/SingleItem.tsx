"use client";

import React, { useState } from "react";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import {
  removeItemFromCart,
  updateCartItemQuantity,
} from "@/redux/features/cart-slice";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2 } from "lucide-react";
import { getValidImageUrl } from "@/lib/adapters/product-adapter";

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
    } else {
      return;
    }
  };

  // Calcular descuento si existe
  const discount = item.discountedPrice && item.price && item.discountedPrice < item.price
    ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
    : undefined;

  return (
    <div className="flex items-center border-t border-gray-200 py-6 px-8 hover:bg-gray-50 transition-colors duration-200">
      {/* Product Info */}
      <div className="min-w-[400px]">
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center rounded-lg bg-gray-100 w-20 h-20 overflow-hidden">
            <Image
              width={80}
              height={80}
              src={getValidImageUrl(item.imgs?.thumbnails?.[0])}
              alt={item.title}
              className="object-cover w-full h-full"
            />
            {discount && (
              <Badge
                variant="destructive"
                size="sm"
                className="absolute -top-1 -right-1 text-2xs px-1 py-0.5"
              >
                -{discount}%
              </Badge>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors duration-200 mb-1">
              <a href="#" className="line-clamp-2">{item.title}</a>
            </h3>
            {item.price && item.discountedPrice && item.discountedPrice < item.price && (
              <p className="text-sm text-gray-500 line-through">${item.price}</p>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="min-w-[180px]">
        <p className="font-semibold text-lg text-gray-900">${item.discountedPrice}</p>
      </div>

      {/* Quantity Selector */}
      <div className="min-w-[275px]">
        <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm w-max">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDecreaseQuantity()}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
            data-testid="quantity-decrease"
            className="h-11 w-11 rounded-l-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center w-16 h-11 border-x border-gray-200 bg-gray-50 font-semibold text-gray-900" data-testid="quantity-input">
            {quantity}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleIncreaseQuantity()}
            aria-label="Aumentar cantidad"
            data-testid="quantity-increase"
            className="h-11 w-11 rounded-r-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="min-w-[200px]">
        <p className="font-bold text-xl text-gray-900">${(item.discountedPrice * quantity).toFixed(2)}</p>
        {item.price && item.discountedPrice && item.discountedPrice < item.price && (
          <p className="text-sm text-gray-500">
            Ahorro: ${((item.price - item.discountedPrice) * quantity).toFixed(2)}
          </p>
        )}
      </div>

      {/* Remove Button */}
      <div className="min-w-[50px] flex justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleRemoveFromCart()}
          aria-label="Eliminar producto del carrito"
          className="h-10 w-10 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SingleItem;
