import Home from '@/components/Home'
import { Metadata } from 'next'
import { TrendingSearchesTest } from '@/components/debug/TrendingSearchesTest'

export const metadata: Metadata = {
  title: 'Pinteya - Home V0 (Versión Anterior) | Pinturas, Ferretería y Corralón',
  description:
    'Descubre la mejor selección de pinturas, herramientas y productos de ferretería en Pinteya. Marcas reconocidas como Sherwin Williams, Petrilac, Sinteplast y más. Envío gratis en compras superiores a $50.000. ¡Compra online ahora!',
  robots: {
    index: false, // Versión anterior, no indexar
    follow: false,
  },
  keywords: [
    'pinturería online',
    'pinturas',
    'ferretería',
    'corralón',
    'Sherwin Williams',
    'Petrilac',
    'Sinteplast',
    'Plavicon',
    'herramientas',
    'construcción',
    'decoración',
    'envío gratis',
    'Argentina',
  ],
  openGraph: {
    title: 'Pinteya - Tu Pinturería Online | Las Mejores Marcas',
    description:
      'Descubre la mejor selección de pinturas, herramientas y productos de ferretería en Pinteya. Marcas reconocidas y envío gratis.',
    images: [
      {
        url: '/images/hero/hero-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'Pinteya - Tu Pinturería Online',
      },
    ],
  },
}

export default function HomeV0Page() {
  return (
    <>
      <Home />
      {/* {process.env.NODE_ENV === 'development' && <TrendingSearchesTest />} */}
    </>
  )
}

