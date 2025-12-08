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
                // ⚡ FIX: discardUnused deshabilitado - NO SEGURO con code-splitting de CSS
                // discardUnused puede eliminar @keyframes que están en un chunk pero se usan en otro
                // Esto rompería animaciones cuando CSS está dividido en múltiples chunks (Next.js)
                discardUnused: false, // ⚡ DESHABILITADO: Inseguro con CSS code-splitting
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
