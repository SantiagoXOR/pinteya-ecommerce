import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MercadoPagoAdminClient from '@/components/admin/MercadoPagoAdminClient';

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

  // TODO: Verificar si el usuario es admin
  // const isAdmin = await checkUserRole(userId);
  // if (!isAdmin) {
  //   redirect('/');
  // }

  return <MercadoPagoAdminClient />;
}

