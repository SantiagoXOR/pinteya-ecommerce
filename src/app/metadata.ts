import type { Metadata } from 'next'

// URL base dinámica por entorno
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://pinteya.com'
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'E-commerce'

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Tu Pinturería Online | Pinturas, Ferretería y Corralón`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    `${SITE_NAME} es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad, herramientas profesionales, accesorios y todo lo necesario para tus proyectos de construcción y decoración. Envío gratis en compras superiores a $50.000.`,
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
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${SITE_NAME} - Tu Pinturería Online | Pinturas, Ferretería y Corralón`,
    description:
      `${SITE_NAME} es tu pinturería online especializada en productos de pintura, ferretería y corralón. Encuentra pinturas de calidad, herramientas profesionales y todo lo necesario para tus proyectos.`,
    url: SITE_URL,
    siteName: SITE_NAME,
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
  // El favicon.png de 996KB y favicon.ico de 499KB estaban causando transferencia innecesaria
  // SVG es escalable, ligero (5KB) y se renderiza perfectamente en todos los navegadores
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }, // ⚡ SVG primero (5KB vs 499KB .ico)
    ],
    shortcut: '/favicon.svg', // ⚡ Cambiado de PNG a SVG
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    // ⚡ REMOVIDO: favicon.ico (499KB) - Los navegadores modernos usan SVG
    // ⚡ REMOVIDO: other icons duplicados que causaban múltiples descargas
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#ea5a17',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#ea5a17',
  },
}
