/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Supabase storage - reemplaza con tu URL real
      'pinteya-ecommerce.supabase.co',
      // Imágenes locales de desarrollo
      'localhost',
    ],
  },
  // Configuración para Clerk
  serverExternalPackages: ['@clerk/nextjs'],
  // Variables de entorno públicas
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
