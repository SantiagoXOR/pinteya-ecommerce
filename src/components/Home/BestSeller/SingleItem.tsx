"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { useCartActions } from "@/hooks/useCartActions";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToCart } from "@/redux/features/cart-slice";

interface SingleItemProps {
  product: Product;
}

const SingleItem: React.FC<SingleItemProps> = ({ product }) => {
  const { addToCart } = useCartActions();
  const { trackEvent } = useAnalytics();
  const dispatch = useDispatch<AppDispatch>();

  // Validar que product existe
  if (!product) {
    return null;
  }

  // Usar product directamente
  const item = product;

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

  // Badge para best sellers - usar precio base para envío gratis
  const badge = discount
    ? "Best Seller"
    : item.price >= 15000
    ? "Envío gratis"
    : "Destacado";

  return (
    <CommercialProductCard
      image={item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={item.title}
      price={item.discountedPrice}
      originalPrice={item.discountedPrice < item.price ? item.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      isNew={badge === "Destacado"}
      stock={50} // Stock por defecto para productos legacy
      productId={item.id}
      cta="Agregar al carrito"
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Información de cuotas automática
      installments={item.discountedPrice >= 5000 ? {
        quantity: 3,
        amount: Math.round(item.discountedPrice / 3),
        interestFree: true
      } : undefined}
      // Envío gratis automático para productos >= $15000
      freeShipping={item.discountedPrice >= 15000}
      shippingText={badge === "Envío gratis" ? "Envío gratis" : badge === "Best Seller" ? "Best Seller" : undefined}
    />
  );
};

export default SingleItem;









