// ===================================
// PINTEYA E-COMMERCE - CHECKOUT SUCCESS PAGE
// ===================================

import { Suspense } from 'react';
import PaymentSuccess from '@/components/Checkout/PaymentSuccess';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    }>
      <PaymentSuccess type="success" />
    </Suspense>
  );
}

export const metadata = {
  title: 'Pago Exitoso - Pinteya',
  description: 'Tu pago ha sido procesado exitosamente',
};
