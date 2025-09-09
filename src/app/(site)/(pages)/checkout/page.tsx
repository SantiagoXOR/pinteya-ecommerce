import React from "react";
import CheckoutExpress from "@/components/Checkout/CheckoutExpress";

export const metadata = {
  title: "Checkout Express - Pinteya",
  description: "Finaliza tu compra de manera segura y rápida con nuestro checkout express",
};

const CheckoutPage = () => {
  return (
    <main className="min-h-screen">
      <CheckoutExpress />
    </main>
  );
};

export default CheckoutPage;
