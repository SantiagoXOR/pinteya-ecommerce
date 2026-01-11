import { HeroSection } from './sections/HeroSection'
import { CategorySection } from './sections/CategorySection'
import { BestSellerSection } from './sections/BestSellerSection'
import type { HomeFastProps } from './types'

/**
 * Componente principal HomeFast optimizado
 * Server Component que renderiza secciones críticas sin lazy loading
 */
export default function HomeFast({ categories, bestSellerProducts }: HomeFastProps) {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Renderizado inmediato */}
      <HeroSection />

      {/* Category Section - Renderizado inmediato */}
      <CategorySection categories={categories} />

      {/* BestSeller Section - Renderizado inmediato */}
      <BestSellerSection products={bestSellerProducts} />

      {/* Componentes below-fold se pueden agregar aquí con Suspense si es necesario */}
    </main>
  )
}
