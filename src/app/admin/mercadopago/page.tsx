import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'MercadoPago Admin - Pinteya E-commerce',
  description: 'Panel de administración para gestión y monitoreo de MercadoPago',
};

// Forzar renderizado dinámico para evitar problemas con auth en prerendering
export const dynamic = 'force-dynamic';

export default async function MercadoPagoAdminPage() {
  // Verificar autenticación
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">MercadoPago Admin</h1>
      <p className="text-gray-600">Panel de administración en desarrollo.</p>
    </div>
  );
}

