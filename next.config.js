/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Supabase storage
      'aakzspzfulgftqlgwkpb.supabase.co',
      // Imágenes locales de desarrollo
      'localhost',
    ],
  },
  // Configuración para Clerk
  serverExternalPackages: ['@clerk/nextjs'],

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // NOTA: Variables de entorno sensibles NO se exponen aquí
  // Solo las variables NEXT_PUBLIC_* son accesibles desde el cliente
};

module.exports = nextConfig;
