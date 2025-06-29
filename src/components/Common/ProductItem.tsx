"use client";
import React from "react";
import { Product } from "@/types/product";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { ProductCard } from "@/components/ui";

const ProductItem = ({ item }: { item: Product }) => {
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

  const handleProductDetails = () => {
    dispatch(updateproductDetails({ ...item }));
  };

  // Calcular descuento si existe
  const discount = item.discountedPrice && item.discountedPrice < item.price
    ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
    : undefined;

  // Determinar badge basado en precio y características
  const badge = item.discountedPrice >= 15000
    ? "Envío gratis"
    : discount
    ? "Oferta especial"
    : "Nuevo";

  return (
    <ProductCard
      context="default" // Contexto para nuevos productos
      image={item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={item.title}
      brand={item.brand}
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

export default ProductItem;
