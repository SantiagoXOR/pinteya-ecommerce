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
import { ProductCard } from "@/components/ui";
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
    <ProductCard
      context="default" // Contexto para lista de productos
      variant="outlined"
      image={item.images?.previews?.[0] || item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={item.name || item.title}
      brand={item.brand}
      price={features.discount ? Math.round(item.price * (1 - features.discount / 100)) : features.currentPrice}
      originalPrice={features.discount ? item.price : undefined}
      discount={features.discount ? `${features.discount}%` : undefined}
      badge={features.freeShipping ? "Envío gratis" : features.fastShipping ? "Envío rápido" : features.isNew ? "Nuevo" : features.badge}
      stock={features.stock}
      stockUnit="unidades"
      productId={item.id}
      cta="Agregar al carrito"
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Datos adicionales para cálculos automáticos
      productData={{
        category: item.category?.name || 'general',
        weight: 1, // Peso por defecto
      }}
    />
  );
};

export default SingleListItem;
