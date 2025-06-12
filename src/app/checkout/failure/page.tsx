// ===================================
// PINTEYA E-COMMERCE - CHECKOUT FAILURE PAGE
// ===================================

import { Suspense } from 'react';
import PaymentSuccess from '@/components/Checkout/PaymentSuccess';

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    }>
      <PaymentSuccess type="failure" />
    </Suspense>
  );
}

export const metadata = {
  title: 'Pago Rechazado - Pinteya',
  description: 'Hubo un problema procesando tu pago',
};
