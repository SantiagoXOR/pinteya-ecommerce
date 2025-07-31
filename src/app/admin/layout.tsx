import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - Pinteya E-commerce',
  description: 'Panel de administración y diagnósticos para Pinteya E-commerce',
  robots: 'noindex, nofollow', // No indexar páginas de admin
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
