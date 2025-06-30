import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Pinteya - Tu Pinturería Online | Pinturas, Ferretería y Corralón',
    template: '%s | Pinteya E-commerce'
  },
  description: 'Pinteya es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad, herramientas profesionales, accesorios y todo lo necesario para tus proyectos de construcción y decoración. Envío gratis en compras superiores a $50.000.',
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
    'Argentina'
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pinteya - Tu Pinturería Online | Pinturas, Ferretería y Corralón',
    description: 'Pinteya es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad, herramientas profesionales y todo lo necesario para tus proyectos.',
    url: 'https://pinteya-ecommerce.vercel.app',
    siteName: 'Pinteya E-commerce',
    images: [
      {
        url: '/images/logo/LOGO POSITIVO.svg',
        width: 620,
        height: 333,
        alt: 'Pinteya - Tu Pinturería Online',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pinteya - Tu Pinturería Online | Pinturas, Ferretería y Corralón',
    description: 'Pinteya es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad y herramientas profesionales.',
    images: ['/images/logo/LOGO POSITIVO.svg'],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/favicon-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/favicon-512x512.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#ea5a17',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#ea5a17',
  },
};
