import { Metadata } from "next";
import ExpressCheckout from "@/components/Checkout/ExpressCheckout";

export const metadata: Metadata = {
  title: "Checkout Express | Pinteya E-commerce",
  description: "Completa tu compra en menos de 2 minutos con nuestro checkout express optimizado para máxima conversión.",
  keywords: "checkout express, compra rápida, conversión optimizada, pintura, ferretería, mercadopago",
};

export default function CheckoutExpressPage() {
  return <ExpressCheckout />;
}
