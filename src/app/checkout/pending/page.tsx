// ===================================
// PINTEYA E-COMMERCE - CHECKOUT PENDING PAGE
// ===================================

import { Suspense } from 'react';
import PaymentSuccess from '@/components/Checkout/PaymentSuccess';

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    }>
      <PaymentSuccess type="pending" />
    </Suspense>
  );
}

export const metadata = {
  title: 'Pago Pendiente - Pinteya',
  description: 'Tu pago está siendo procesado',
};
