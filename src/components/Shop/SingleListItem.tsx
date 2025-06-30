"use client";
import React from "react";
import { Product } from "@/types/product";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import Link from "next/link";
import Image from "next/image";
import { CommercialProductCard } from "@/components/ui/product-card-commercial";
import { ExtendedProduct, calculateProductFeatures } from "@/lib/adapters/productAdapter";

const SingleListItem = ({ item }: { item: ExtendedProduct }) => {
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

  // Calcular características del producto usando el adaptador
  const features = calculateProductFeatures(item);

  return (
    <CommercialProductCard
      className="bg-white" // Forzar fondo blanco
      image={item.images?.previews?.[0] || item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={item.name || item.title}
      brand={item.brand}
      price={features.discount ? Math.round(item.price * (1 - features.discount / 100)) : features.currentPrice}
      originalPrice={features.discount ? item.price : undefined}
      discount={features.discount ? `${features.discount}%` : undefined}
      isNew={features.isNew}
      stock={features.stock}
      productId={item.id}
      cta="Agregar al carrito"
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Información de cuotas automática
      installments={features.currentPrice >= 5000 ? {
        quantity: 3,
        amount: Math.round(features.currentPrice / 3),
        interestFree: true
      } : undefined}
      // Envío gratis automático para productos >= $15000
      freeShipping={features.freeShipping || features.currentPrice >= 15000}
      shippingText={features.freeShipping ? "Envío gratis" : features.fastShipping ? "Envío rápido" : undefined}
    />
  );
};

export default SingleListItem;
