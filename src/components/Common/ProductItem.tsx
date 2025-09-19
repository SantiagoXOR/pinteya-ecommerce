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
import { CommercialProductCard } from "@/components/ui/product-card-commercial";

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
  const hasDiscount = item.discountedPrice && item.discountedPrice < item.price;
  const discount = hasDiscount
    ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
    : undefined;

  // Precio final a mostrar
  const finalPrice = hasDiscount ? item.discountedPrice : item.price;

  // Determinar badge basado en precio y características
  const badge = finalPrice >= 15000
    ? "Envío gratis"
    : discount
    ? "Oferta especial"
    : "Nuevo";

  return (
    <CommercialProductCard
      image={item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={item.title}
      brand={item.brand}
      price={finalPrice}
      originalPrice={hasDiscount ? item.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      isNew={badge === "Nuevo"}
      stock={50} // Stock por defecto para productos legacy
      productId={item.id}
      cta="Agregar al carrito"
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Información de cuotas automática
      installments={finalPrice >= 5000 ? {
        quantity: 3,
        amount: Math.round(finalPrice / 3),
        interestFree: true
      } : undefined}
      // Envío gratis automático para productos >= $15000
      freeShipping={finalPrice >= 15000}
      shippingText={badge === "Envío gratis" ? "Envío gratis" : undefined}
    />
  );
};

export default ProductItem;









