/**
 * ⚡ OPTIMIZACIÓN: Fuentes optimizadas para Turbopack
 * 
 * NOTA: Turbopack tiene un bug conocido con next/font/local que genera URLs mal formateadas.
 * Por ahora usamos una variable CSS simple para mantener compatibilidad con Turbopack.
 * Las fuentes se cargan mediante CSS manual en layout.tsx
 */

// ⚡ FIX Turbopack: Usamos variable CSS simple en lugar de next/font/local
// hasta que se solucione el bug con URLs mal formateadas
export const euclidCircularA = {
  variable: '--font-euclid',
  className: 'font-euclid',
  style: {
    fontFamily: 'var(--font-euclid), "Euclid Circular A", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
}

/**
 * Fuente secundaria: Inter (sistema)
 * Solo si se usa en alguna parte específica
 */
// export const inter = Inter({
//   subsets: ['latin'],
//   variable: '--font-inter',
//   display: 'swap',
//   preload: true,
// })







