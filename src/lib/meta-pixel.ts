/**
 * Configuración de Meta Pixel (Facebook/Instagram Ads) para Pinteya E-commerce
 * Tracking de eventos de conversión y comportamiento de usuarios
 */

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

// Verificar si Meta Pixel está habilitado
export const isMetaPixelEnabled = (): boolean => {
  return !!META_PIXEL_ID && META_PIXEL_ID.length > 0 && typeof window !== 'undefined'
}

// Verificar si Meta Pixel está listo para usar
export const isMetaPixelReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

// Esperar a que Meta Pixel esté listo
export const waitForMetaPixel = (): Promise<void> => {
  return new Promise(resolve => {
    if (isMetaPixelReady()) {
      resolve()
      return
    }

    const checkMetaPixel = () => {
      if (isMetaPixelReady()) {
        resolve()
      } else {
        setTimeout(checkMetaPixel, 100)
      }
    }

    checkMetaPixel()
  })
}

// Inicializar Meta Pixel
export const initMetaPixel = (): void => {
  if (!isMetaPixelEnabled()) {
    return
  }

  // Función fbq
  window.fbq = function () {
    window.fbq.callMethod
      ? window.fbq.callMethod.apply(window.fbq, arguments as any)
      : window.fbq.queue.push(arguments)
  }

  if (!window._fbq) {
    window._fbq = window.fbq
  }

  window.fbq.push = window.fbq
  window.fbq.loaded = true
  window.fbq.version = '2.0'
  window.fbq.queue = []

  // Inicializar el pixel
  window.fbq('init', META_PIXEL_ID)
}

// Trackear evento de PageView
export const trackPageView = (): void => {
  if (!isMetaPixelReady()) {
    return
  }

  try {
    window.fbq('track', 'PageView')
  } catch (error) {
    console.warn('Error tracking Meta Pixel PageView:', error)
  }
}

// Trackear evento personalizado
export const trackEvent = (eventName: string, parameters?: Record<string, any>): void => {
  if (!isMetaPixelReady()) {
    return
  }

  try {
    if (parameters) {
      window.fbq('track', eventName, parameters)
    } else {
      window.fbq('track', eventName)
    }
  } catch (error) {
    console.warn(`Error tracking Meta Pixel event ${eventName}:`, error)
  }
}

// Trackear evento personalizado (custom event)
export const trackCustomEvent = (eventName: string, parameters?: Record<string, any>): void => {
  if (!isMetaPixelReady()) {
    return
  }

  try {
    if (parameters) {
      window.fbq('trackCustom', eventName, parameters)
    } else {
      window.fbq('trackCustom', eventName)
    }
  } catch (error) {
    console.warn(`Error tracking Meta Pixel custom event ${eventName}:`, error)
  }
}

// ===== EVENTOS ESTÁNDAR DE E-COMMERCE =====

/**
 * ViewContent - Usuario visualiza contenido (producto)
 * @param contentName - Nombre del producto
 * @param contentCategory - Categoría del producto
 * @param contentIds - Array de IDs de contenido
 * @param value - Valor del contenido
 * @param currency - Moneda (default: ARS)
 */
export const trackViewContent = (
  contentName: string,
  contentCategory: string,
  contentIds: string[],
  value: number,
  currency: string = 'ARS'
): void => {
  trackEvent('ViewContent', {
    content_name: contentName,
    content_category: contentCategory,
    content_ids: contentIds,
    content_type: 'product',
    value: value,
    currency: currency,
  })
}

/**
 * AddToCart - Usuario agrega producto al carrito
 * @param contentName - Nombre del producto
 * @param contentId - ID del producto
 * @param contentCategory - Categoría del producto
 * @param value - Valor total (precio * cantidad)
 * @param currency - Moneda (default: ARS)
 */
export const trackAddToCart = (
  contentName: string,
  contentId: string,
  contentCategory: string,
  value: number,
  currency: string = 'ARS'
): void => {
  trackEvent('AddToCart', {
    content_name: contentName,
    content_ids: [contentId],
    content_type: 'product',
    content_category: contentCategory,
    value: value,
    currency: currency,
  })
}

/**
 * InitiateCheckout - Usuario inicia el proceso de checkout
 * @param contents - Array de productos en el carrito
 * @param value - Valor total del carrito
 * @param currency - Moneda (default: ARS)
 * @param numItems - Número de items en el carrito
 */
export const trackInitiateCheckout = (
  contents: Array<{
    id: string
    quantity: number
    item_price?: number
  }>,
  value: number,
  currency: string = 'ARS',
  numItems?: number
): void => {
  trackEvent('InitiateCheckout', {
    contents: contents,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: numItems || contents.length,
  })
}

/**
 * Purchase - Usuario completa una compra
 * @param value - Valor total de la compra
 * @param currency - Moneda (default: ARS)
 * @param contents - Array de productos comprados
 * @param numItems - Número de items comprados
 * @param orderId - ID de la orden (opcional pero recomendado)
 */
export const trackPurchase = (
  value: number,
  currency: string = 'ARS',
  contents: Array<{
    id: string
    quantity: number
    item_price?: number
  }>,
  numItems?: number,
  orderId?: string
): void => {
  const purchaseData: Record<string, any> = {
    value: value,
    currency: currency,
    contents: contents,
    content_type: 'product',
    num_items: numItems || contents.length,
  }

  // Agregar order_id solo si está disponible (evita duplicados)
  if (orderId) {
    purchaseData.order_id = orderId
  }

  trackEvent('Purchase', purchaseData)
}

/**
 * AddToWishlist - Usuario agrega producto a favoritos
 * @param contentName - Nombre del producto
 * @param contentId - ID del producto
 * @param contentCategory - Categoría del producto
 * @param value - Valor del producto
 * @param currency - Moneda (default: ARS)
 */
export const trackAddToWishlist = (
  contentName: string,
  contentId: string,
  contentCategory: string,
  value: number,
  currency: string = 'ARS'
): void => {
  trackEvent('AddToWishlist', {
    content_name: contentName,
    content_ids: [contentId],
    content_category: contentCategory,
    content_type: 'product',
    value: value,
    currency: currency,
  })
}

/**
 * Search - Usuario realiza una búsqueda
 * @param searchString - Término de búsqueda
 * @param contentCategory - Categoría donde se busca (opcional)
 */
export const trackSearch = (searchString: string, contentCategory?: string): void => {
  const searchData: Record<string, any> = {
    search_string: searchString,
  }

  if (contentCategory) {
    searchData.content_category = contentCategory
  }

  trackEvent('Search', searchData)
}

/**
 * Lead - Usuario se registra o muestra interés
 * @param value - Valor estimado del lead (opcional)
 * @param currency - Moneda (default: ARS)
 * @param contentName - Nombre del contenido (opcional)
 */
export const trackLead = (value?: number, currency: string = 'ARS', contentName?: string): void => {
  const leadData: Record<string, any> = {
    content_name: contentName || 'Registration',
  }

  if (value) {
    leadData.value = value
    leadData.currency = currency
  }

  trackEvent('Lead', leadData)
}

/**
 * CompleteRegistration - Usuario completa el registro
 * @param registrationMethod - Método de registro (email, google, facebook, etc.)
 * @param value - Valor estimado del registro (opcional)
 * @param currency - Moneda (default: ARS)
 */
export const trackCompleteRegistration = (
  registrationMethod?: string,
  value?: number,
  currency: string = 'ARS'
): void => {
  const registrationData: Record<string, any> = {}

  if (registrationMethod) {
    registrationData.content_name = registrationMethod
  }

  if (value) {
    registrationData.value = value
    registrationData.currency = currency
  }

  trackEvent('CompleteRegistration', registrationData)
}

/**
 * Contact - Usuario hace contacto (WhatsApp, email, etc.)
 */
export const trackContact = (): void => {
  trackEvent('Contact')
}

/**
 * ViewCategory - Usuario ve una categoría de productos
 * @param categoryName - Nombre de la categoría
 */
export const trackViewCategory = (categoryName: string): void => {
  trackCustomEvent('ViewCategory', {
    content_category: categoryName,
  })
}

/**
 * ClickProduct - Usuario hace clic en un producto (para tracking adicional)
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param source - De dónde viene el clic (grid, search, related, etc.)
 */
export const trackClickProduct = (
  productId: string,
  productName: string,
  source: string
): void => {
  trackCustomEvent('ClickProduct', {
    product_id: productId,
    product_name: productName,
    source: source,
  })
}

// ===== UTILIDADES AVANZADAS =====

/**
 * Configurar datos del usuario (para Advanced Matching)
 * IMPORTANTE: Solo usar con consentimiento del usuario
 * @param userData - Datos hasheados del usuario (email, phone, etc.)
 */
export const setUserData = (userData: {
  em?: string // email hasheado
  ph?: string // teléfono hasheado
  fn?: string // nombre hasheado
  ln?: string // apellido hasheado
  ct?: string // ciudad hasheada
  st?: string // estado/provincia hasheado
  zp?: string // código postal hasheado
  country?: string // código de país (ISO 2 letras)
}): void => {
  if (!isMetaPixelReady()) {
    return
  }

  try {
    window.fbq('init', META_PIXEL_ID, userData)
  } catch (error) {
    console.warn('Error setting Meta Pixel user data:', error)
  }
}

/**
 * Revocar consentimiento (para GDPR/LGPD compliance)
 */
export const revokeConsent = (): void => {
  if (!isMetaPixelReady()) {
    return
  }

  try {
    window.fbq('consent', 'revoke')
  } catch (error) {
    console.warn('Error revoking Meta Pixel consent:', error)
  }
}

/**
 * Otorgar consentimiento (para GDPR/LGPD compliance)
 */
export const grantConsent = (): void => {
  if (!isMetaPixelReady()) {
    return
  }

  try {
    window.fbq('consent', 'grant')
  } catch (error) {
    console.warn('Error granting Meta Pixel consent:', error)
  }
}

// Exportar objeto con todos los métodos para uso conveniente
export const metaPixel = {
  init: initMetaPixel,
  isEnabled: isMetaPixelEnabled,
  isReady: isMetaPixelReady,
  waitForReady: waitForMetaPixel,
  pageView: trackPageView,
  event: trackEvent,
  customEvent: trackCustomEvent,
  viewContent: trackViewContent,
  addToCart: trackAddToCart,
  initiateCheckout: trackInitiateCheckout,
  purchase: trackPurchase,
  addToWishlist: trackAddToWishlist,
  search: trackSearch,
  lead: trackLead,
  completeRegistration: trackCompleteRegistration,
  contact: trackContact,
  viewCategory: trackViewCategory,
  clickProduct: trackClickProduct,
  setUserData: setUserData,
  revokeConsent: revokeConsent,
  grantConsent: grantConsent,
}

