/**
 * ⚡ OPTIMIZACIÓN: Fuentes optimizadas con next/font/google
 * 
 * Work Sans - Tipografía humanista con excelente legibilidad numérica
 * Ideal para e-commerce (precios, cantidades, etc.)
 * Compatible con Turbopack (a diferencia de next/font/local que tenía bugs)
 */

import { Work_Sans } from 'next/font/google'

export const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-work-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
})

// Mantener compatibilidad con el sistema actual
export const workSansFont = {
  variable: workSans.variable,
  className: workSans.className,
  style: {
    fontFamily: workSans.style.fontFamily,
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







