/**
 * ⚡ OPTIMIZACIÓN: Configuración PostCSS para CSS optimizado
 * 
 * Plugins aplicados:
 * 1. tailwindcss - Genera utilidades CSS
 * 2. autoprefixer - Añade prefijos de navegador
 * 3. cssnano (producción) - Minifica y optimiza CSS
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
