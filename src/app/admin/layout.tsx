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
      {/* Header de Admin */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🔧 Admin Panel
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Pinteya E-commerce
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer de Admin */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>⚠️ Área restringida - Solo para administradores y desarrollo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
