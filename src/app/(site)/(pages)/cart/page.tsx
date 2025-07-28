import { redirect } from "next/navigation";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Carrito - Pinteya E-commerce",
  description: "Carrito de compras - Pinteya E-commerce",
  // other metadata
};

const CartPage = () => {
  // Redirigir a la homepage donde el usuario puede usar el CartSidebarModal
  redirect("/");
};

export default CartPage;
