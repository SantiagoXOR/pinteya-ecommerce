import { Metadata } from "next";
import SimplifiedCheckout from "@/components/Checkout/SimplifiedCheckout";

export const metadata: Metadata = {
  title: "Checkout Simplificado | Pinteya E-commerce",
  description: "Finaliza tu compra de forma rápida y segura con nuestro checkout simplificado.",
  keywords: "checkout, compra, pago, pintura, ferretería, mercadopago",
};

export default function CheckoutV2Page() {
  return <SimplifiedCheckout />;
}
