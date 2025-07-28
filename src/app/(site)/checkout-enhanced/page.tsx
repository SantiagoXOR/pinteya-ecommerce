import { Metadata } from "next";
import EnhancedCheckout from "@/components/Checkout/EnhancedCheckout";

export const metadata: Metadata = {
  title: "Checkout Mejorado | Pinteya E-commerce",
  description: "Experiencia de checkout optimizada con design system Pinteya, navegación por pasos y integración MercadoPago mejorada.",
  keywords: "checkout mejorado, UX optimizada, design system, pintura, ferretería, mercadopago, conversión",
};

export default function CheckoutEnhancedPage() {
  return <EnhancedCheckout variant="default" showProgress={true} enableStepNavigation={true} />;
}
