import HomeV3 from '@/components/Home-v3'
import { Metadata } from 'next'
// ⚡ OPTIMIZACIÓN: CSS glassmorphism se carga de forma diferida en el componente HomeV3
// Removido import bloqueante para mejorar PageSpeed Insights

export const metadata: Metadata = {
  title: 'Pinteya - Home V3 Glassmorphism (Versión de Prueba) | Envío Gratis +$50.000',
  description:
    'Versión de prueba del home con diseño glassmorphism. Descubre la mejor selección de pinturas, herramientas y productos de ferretería. Marcas reconocidas como Sherwin Williams, Petrilac, Sinteplast y más. Envío gratis en compras superiores a $50.000.',
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
    'glassmorphism',
    'diseño moderno',
  ],
}

export default function HomeV3Page() {
  return <HomeV3 />
}




