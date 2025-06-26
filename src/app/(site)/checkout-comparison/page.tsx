import { Metadata } from "next";
import Breadcrumb from "@/components/Common/Breadcrumb";
import CheckoutComparison from "@/components/Checkout/CheckoutComparison";

export const metadata: Metadata = {
  title: "Comparación de Checkout | Pinteya E-commerce",
  description: "Compara el proceso de checkout actual con la nueva versión simplificada. Descubre las mejoras en conversión y experiencia de usuario.",
  keywords: "checkout, comparación, UX, conversión, proceso de compra, optimización",
};

export default function CheckoutComparisonPage() {
  return (
    <>
      <Breadcrumb 
        title="Comparación de Checkout" 
        pages={["Checkout", "Comparación"]} 
      />
      
      <section className="pb-20 pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CheckoutComparison />
        </div>
      </section>
    </>
  );
}
