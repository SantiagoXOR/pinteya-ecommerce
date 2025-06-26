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
import { ProductCard } from "@/components/ui/card";
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
      variant="outlined"
      image={item.images?.previews?.[0] || item.imgs?.previews?.[0] || '/images/placeholder.jpg'}
      title={item.name || item.title}
      price={features.currentPrice}
      originalPrice={features.discount ? item.price : undefined}
      rating={5} // Por ahora fijo, se puede mejorar con datos reales
      reviews={0} // No disponible en BD actual
      badge={features.badge}
      stock={features.stock}
      freeShipping={features.freeShipping}
      fastShipping={features.fastShipping}
      isNew={features.isNew}
      onAddToCart={handleAddToCart}
      onQuickView={() => {
        openModal();
        handleQuickViewUpdate();
      }}
      onWishlist={handleItemToWishList}
      showCartAnimation={true}
    />
  );
};

export default SingleListItem;
