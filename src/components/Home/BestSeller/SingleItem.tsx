"use client";
import React from "react";
import { Product } from "@/types/product";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { ProductCard } from "@/components/ui";

const SingleItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();

  // update the QuickView state
  const handleQuickViewUpdate = () => {
    dispatch(updateQuickView({ ...item }));
  };

  // add to cart
  const handleAddToCart = () => {
    dispatch(
      addItemToCart({
        ...item,
        quantity: 1,
      })
    );
  };

  const handleItemToWishList = () => {
    dispatch(
      addItemToWishlist({
        ...item,
        status: "available",
        quantity: 1,
      })
    );
  };

  // Calcular descuento si existe
  const discount = item.discountedPrice && item.discountedPrice < item.price
    ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
    : undefined;

  // Badge para best sellers
  const badge = discount
    ? "Best Seller"
    : item.discountedPrice >= 15000
    ? "Envío gratis"
    : "Destacado";

  return (
    <ProductCard
      context="default" // Contexto para best sellers
      image={item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={item.title}
      price={item.discountedPrice}
      originalPrice={item.discountedPrice < item.price ? item.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      badge={badge}
      stock={50} // Stock por defecto para productos legacy
      stockUnit="unidades"
      productId={item.id}
      cta="Agregar al carrito"
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
    />
  );
};

export default SingleItem;
