// ===================================
// PINTEYA E-COMMERCE - CONSTANTES DE TIENDA
// ===================================

export const SHOP_CONSTANTS = {
  // Paginación
  PRODUCTS_PER_PAGE_SIDEBAR: 1000,
  PRODUCTS_PER_PAGE_GRID: 12,
  PRODUCTS_PER_PAGE_LIST: 8,

  // Timeouts
  COUPON_APPLY_DELAY: 1000,
  SEARCH_DEBOUNCE_DELAY: 300,

  // Límites
  MAX_CART_ITEMS: 99,
  MIN_ORDER_AMOUNT: 1000, // Pesos argentinos

  // Configuración de filtros
  PRICE_RANGES: [
    { min: 0, max: 5000, label: 'Hasta $5.000' },
    { min: 5000, max: 15000, label: '$5.000 - $15.000' },
    { min: 15000, max: 30000, label: '$15.000 - $30.000' },
    { min: 30000, max: 50000, label: '$30.000 - $50.000' },
    { min: 50000, max: undefined, label: 'Más de $50.000' },
  ],

  // Ordenamiento
  SORT_OPTIONS: [
    { value: 'created_at', label: 'Más recientes', order: 'desc' },
    { value: 'name', label: 'Nombre A-Z', order: 'asc' },
    { value: 'name', label: 'Nombre Z-A', order: 'desc' },
    { value: 'price', label: 'Precio menor', order: 'asc' },
    { value: 'price', label: 'Precio mayor', order: 'desc' },
  ],
} as const

export const PRODUCT_CATEGORIES = {
  PAREDES: {
    name: 'Paredes',
    slug: 'paredes',
    description: 'Pinturas para paredes interiores y exteriores',
  },
  METALES_Y_MADERAS: {
    name: 'Metales y Maderas',
    slug: 'metales-y-maderas',
    description: 'Productos para protección y acabado de maderas y metales',
  },
  TECHOS: {
    name: 'Techos',
    slug: 'techos',
    description: 'Impermeabilizantes y pinturas para techos y cielorrasos',
  },
  COMPLEMENTOS: {
    name: 'Complementos',
    slug: 'complementos',
    description: 'Herramientas y accesorios para pintura',
  },
  ANTIHUMEDAD: {
    name: 'Antihumedad',
    slug: 'antihumedad',
    description: 'Productos especiales para ambientes húmedos',
  },
  PISCINAS: {
    name: 'Piscinas',
    slug: 'Piscinas',
    description: 'Productos para mantenimiento de piscinas',
  },
  REPARACIONES: {
    name: 'Reparaciones',
    slug: 'reparaciones',
    description: 'Masillas y productos para reparación de superficies',
  },
  PISOS: {
    name: 'Pisos',
    slug: 'pisos',
    description: 'Barnices y productos para pisos de madera',
  },
} as const

export const CHECKOUT_CONSTANTS = {
  STEPS: {
    FORM: 'form',
    PROCESSING: 'processing',
    REDIRECT: 'redirect',
    SUCCESS: 'success',
    ERROR: 'error',
  },

  PAYMENT_METHODS: {
    MERCADOPAGO: 'mercadopago',
    BANK_TRANSFER: 'bank',
    CASH: 'cash',
  },

  SHIPPING_COST: 2500, // Pesos argentinos
  FREE_SHIPPING_THRESHOLD: 25000, // Pesos argentinos
} as const

export const VALIDATION_CONSTANTS = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,
  PHONE_REGEX: /^[0-9]{10,11}$/,
  DNI_REGEX: /^[0-9]{7,8}$/,
} as const

export const SEARCH_CONSTANTS = {
  // Búsquedas recientes
  MAX_RECENT_SEARCHES: 5,
  RECENT_SEARCHES_STORAGE_KEY: 'pinteya-recent-searches',
  RECENT_SEARCHES_EXPIRATION_DAYS: 30,

  // Búsquedas trending
  MAX_TRENDING_SEARCHES: 6,
  TRENDING_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos
  TRENDING_DAYS_BACK: 7,

  // Configuración general
  SEARCH_DEBOUNCE_MS: 300,
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SUGGESTIONS: 8,
} as const
