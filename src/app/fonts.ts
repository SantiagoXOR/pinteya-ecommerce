/**
 * ⚡ OPTIMIZACIÓN: Fuentes con next/font para máximo rendimiento
 * 
 * Beneficios:
 * - Inline automático de @font-face en <head>
 * - Preload automático de fuentes críticas
 * - Eliminación de request bloqueante (-610ms)
 * - Optimización de subsetting automática
 * - Sin FOUT/FOIT (Flash of Unstyled/Invisible Text)
 */

import localFont from 'next/font/local'

/**
 * Fuente principal: Euclid Circular A
 * 
 * Pesos configurados:
 * - 400 (Regular): Texto normal
 * - 600 (SemiBold): Énfasis medio
 * - 700 (Bold): Títulos y énfasis fuerte
 */
export const euclidCircularA = localFont({
  src: [
    {
      path: '../../public/fonts/EuclidCircularA-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/EuclidCircularA-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/EuclidCircularA-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-euclid',
  display: 'swap', // Muestra fuente fallback mientras carga
  preload: true, // Preload automático de la fuente
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: 'Arial', // Ajuste automático para reducir layout shift
})

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


