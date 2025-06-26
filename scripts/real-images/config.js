// Configuración para scraping de imágenes reales
module.exports = {
  // Configuración general
  scraping: {
    delayBetweenRequests: 8000,      // 8 segundos entre requests
    delayBetweenSites: 30000,        // 30 segundos entre sitios
    maxRetriesPerImage: 3,           // Máximo 3 reintentos
    timeoutPerRequest: 25000,        // 25 segundos timeout
    respectfulHours: [9, 18]         // Solo entre 9AM-6PM
  },
  
  // Criterios de calidad de imágenes
  imageQuality: {
    minWidth: 400,
    minHeight: 400,
    maxFileSize: 500 * 1024,         // 500KB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    minQualityScore: 0.7
  },
  
  // Configuración por marca
  brands: {
    Poxipol: {
      enabled: true,
      priority: 1,
      official: 'https://www.poxipol.com.ar'
    },
    Plavicon: {
      enabled: true,
      priority: 2,
      official: 'https://www.plavicon.com.ar'
    },
    Galgo: {
      enabled: true,
      priority: 3,
      official: null
    },
    Sinteplast: {
      enabled: true,
      priority: 4,
      official: 'https://www.sinteplast.com.ar'
    }
  }
};