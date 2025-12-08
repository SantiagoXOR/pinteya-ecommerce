/**
 * ⚡ OPTIMIZACIÓN: Configuración PostCSS para CSS optimizado
 * 
 * Plugins aplicados:
 * 1. tailwindcss - Genera utilidades CSS (con purge automático)
 * 2. autoprefixer - Añade prefijos de navegador
 * 3. cssnano (producción) - Minifica y optimiza CSS
 * 4. ⚡ NUEVO: PurgeCSS más agresivo para eliminar CSS sin usar
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // ⚡ OPTIMIZACIÓN: cssnano para minificación agresiva en producción
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'advanced',
              {
                // Optimizaciones avanzadas
                discardComments: {
                  removeAll: true, // Remover todos los comentarios
                },
                reduceIdents: true, // Reducir nombres de keyframes/counters
                mergeIdents: true, // Merge idénticos @keyframes
                mergeRules: true, // Merge reglas duplicadas
                mergeLonghand: true, // Merge propiedades longhand (margin-top, margin-bottom -> margin)
                colormin: true, // Minificar colores (#ffffff -> #fff)
                normalizeWhitespace: true, // Normalizar espacios en blanco
                minifyFontValues: true, // Minificar valores de fuentes
                minifySelectors: true, // Minificar selectores
                // ⚡ CRITICAL FIX: discardUnused deshabilitado - NO SEGURO con code-splitting de CSS
                // PROBLEMA: discardUnused puede eliminar @keyframes que están definidos en un chunk CSS
                // pero se usan en otro chunk, rompiendo animaciones cuando Next.js divide CSS en múltiples chunks.
                // EJEMPLO: Si @keyframes fadeIn está en chunk A pero se usa en chunk B, cssnano lo eliminará
                // como "no usado" en chunk A, rompiendo la animación en chunk B.
                // SOLUCIÓN: Mantener discardUnused: false para preservar @keyframes en todos los chunks.
                // El proyecto usa múltiples @keyframes (loading, shimmer, fadeIn, slideUp, etc.) en:
                // - src/app/css/style.css
                // - src/styles/home-v2-animations.css
                // - src/styles/mobile-modals.css
                // - src/styles/collapsible.css
                // - src/styles/checkout-transition.css
                // - src/styles/checkout-mobile.css
                // - src/components/Header/header-animations.css
                // - src/app/auth/auth-page.css
                // - tailwind.config.ts (animaciones personalizadas)
                discardUnused: false, // ⚡ DESHABILITADO: Inseguro con CSS code-splitting de Next.js
                discardEmpty: true, // Eliminar reglas vacías (seguro)
                discardDuplicates: true, // Eliminar reglas duplicadas (seguro)
                // Configuración conservadora para evitar romper estilos
                calc: false, // No optimizar calc() automáticamente
                zindex: false, // No modificar z-index (puede romper jerarquía)
              },
            ],
          },
        }
      : {}),
  },
}
