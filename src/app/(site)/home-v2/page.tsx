import HomeV2 from '@/components/Home-v2'
import { Metadata } from 'next'
import '@/styles/home-v2-animations.css'

export const metadata: Metadata = {
  title: 'Pinteya - Home V2 (Versión de Prueba) | Envío Gratis +$50.000',
  description:
    'Versión de prueba del home optimizado. Descubre la mejor selección de pinturas, herramientas y productos de ferretería. Marcas reconocidas como Sherwin Williams, Petrilac, Sinteplast y más. Envío gratis en compras superiores a $50.000.',
  robots: {
    index: false, // No indexar esta versión de test
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
}

export default function HomeV2Page() {
  return <HomeV2 />
}

