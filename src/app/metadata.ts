import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Pinteya - Tu Pinturería Online | Pinturas, Ferretería y Corralón',
    template: '%s | Pinteya E-commerce',
  },
  description:
    'Pinteya es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad, herramientas profesionales, accesorios y todo lo necesario para tus proyectos de construcción y decoración. Envío gratis en compras superiores a $50.000.',
  keywords: [
    'pinturería online',
    'pinturas',
    'ferretería',
    'corralón',
    'herramientas',
    'construcción',
    'decoración',
    'Sherwin Williams',
    'Petrilac',
    'Sinteplast',
    'Plavicon',
    'Akapol',
    'envío gratis',
    'Argentina',
  ],
  authors: [{ name: 'Pinteya E-commerce' }],
  creator: 'Pinteya E-commerce',
  publisher: 'Pinteya E-commerce',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pinteya-ecommerce.vercel.app'),
  openGraph: {
    title: 'Pinteya - Tu Pinturería Online | Pinturas, Ferretería y Corralón',
    description:
      'Pinteya es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad, herramientas profesionales y todo lo necesario para tus proyectos.',
    url: 'https://pinteya-ecommerce.vercel.app',
    siteName: 'Pinteya E-commerce',
    images: [
      {
        url: '/images/quickview/quick-view-01.png',
        width: 1200,
        height: 630,
        alt: 'Pinteya - Tu Pinturería Online',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pinteya - Tu Pinturería Online | Pinturas, Ferretería y Corralón',
    description:
      'Pinteya es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad y herramientas profesionales.',
    images: ['/images/quickview/quick-view-01.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // ⚡ CRITICAL FIX: Favicons optimizados - Solo SVG para mejor performance
  // El favicon.png de 996KB estaba causando 2.9MB de transferencia innecesaria
  // SVG es escalable, ligero (5KB) y se renderiza perfectamente en todos los navegadores
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }, // ⚡ SVG primero (5KB vs 996KB)
      { url: '/favicon.ico', type: 'image/x-icon' }, // Fallback para navegadores antiguos
    ],
    shortcut: '/favicon.svg', // ⚡ Cambiado de PNG a SVG
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    // ⚡ REMOVIDO: other icons duplicados que causaban múltiples descargas
    // Los navegadores modernos usan SVG, los antiguos usan .ico
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#ea5a17',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#ea5a17',
  },
}
