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
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { useCartWithBackend } from "@/hooks/useCartWithBackend";
import { CommercialProductCard } from "@/components/ui/product-card-commercial";
import { ExtendedProduct, calculateProductFeatures } from "@/lib/adapters/productAdapter";

interface SingleListItemProps {
  product: ExtendedProduct;
}

const SingleListItem: React.FC<SingleListItemProps> = ({ product }) => {
  const { addToCart } = useCartActions();
  const { trackEvent } = useAnalytics();
  const dispatch = useDispatch<AppDispatch>();
  const { addItem } = useCartWithBackend();

  // Usar product directamente
  const item = product;

  // update the QuickView state
  const handleQuickViewUpdate = () => {
    dispatch(updateQuickView({ ...item }));
  };

  // add to cart - Conectado con backend
  const handleAddToCart = async () => {
    // Intentar agregar al backend primero
    const success = await addItem(item.id, 1);

    if (success) {
      // Si el backend funciona, también actualizar Redux para compatibilidad
      dispatch(
        addItemToCart({
          ...item,
          quantity: 1,
        })
      );
    } else {
      // Si falla el backend, solo usar Redux (fallback)
      dispatch(
        addItemToCart({
          ...item,
          quantity: 1,
        })
      );
    }
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









