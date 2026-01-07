/**
 * ⚡ OPTIMIZACIÓN: Fuentes optimizadas con next/font/google
 * 
 * Plus Jakarta Sans - Tipografía humanista moderna con excelente legibilidad numérica
 * Ideal para e-commerce (precios, cantidades, etc.)
 * Compatible con Turbopack (a diferencia de next/font/local que tenía bugs)
 */

import { Plus_Jakarta_Sans } from 'next/font/google'

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
})

// Mantener compatibilidad con el sistema actual
export const plusJakartaSansFont = {
  variable: plusJakartaSans.variable,
  className: plusJakartaSans.className,
  style: {
    fontFamily: plusJakartaSans.style.fontFamily,
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







