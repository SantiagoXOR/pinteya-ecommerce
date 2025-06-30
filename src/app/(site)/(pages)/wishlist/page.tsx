import React from "react";
import { Wishlist } from "@/components/Wishlist";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Deseos | Pinteya E-commerce",
  description: "Guarda tus productos favoritos de pinturería, ferretería y corralón en tu lista de deseos. Accede fácilmente a pinturas, herramientas y accesorios que te interesan.",
  keywords: [
    "lista de deseos",
    "favoritos",
    "pinturería",
    "ferretería",
    "pinturas favoritas",
    "herramientas favoritas",
    "wishlist",
    "Pinteya"
  ],
};

const WishlistPage = () => {
  return (
    <main>
      <Wishlist />
    </main>
  );
};

export default WishlistPage;
