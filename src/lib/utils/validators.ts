// ===================================
// UTILIDADES DE VALIDACIÓN
// Funciones para validar datos críticos del sistema
// ===================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string;
}

export interface ProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: number;
  brand: string;
  images: string[];
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderData {
  user_id: string;
  items: OrderItem[];
  total: number;
  shipping_address: Address;
  payment_method: string;
}

export interface PaymentData {
  method: string;
  amount: number;
  currency: string;
  payment_method_id?: string;
  installments?: number;
  payer?: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

export interface DiscountData {
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
}

// ===================================
// VALIDACIÓN DE EMAIL
// ===================================

export function validateEmail(email: any): boolean {
  // Handle null, undefined, and non-string values
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Validar longitud total del email
  if (email.length > 254) {
    return false;
  }

  // Validar que no empiece o termine con punto
  if (email.startsWith('.') || email.endsWith('.')) {
    return false;
  }

  // Validar que tenga exactamente un @
  if (email.split('@').length !== 2) {
    return false;
  }

  // Validar longitud de partes locales y dominio
  const [localPart, domain] = email.split('@');
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }

  // Validar que no tenga puntos consecutivos
  if (email.includes('..')) {
    return false;
  }

  // El dominio debe tener al menos un punto (TLD requerido)
  if (!domain.includes('.')) {
    return false;
  }

  // Regex para validación de email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  
  return emailRegex.test(email);
}

// ===================================
// VALIDACIÓN DE CONTRASEÑA
// ===================================

export function validatePassword(password: any): ValidationResult {
  const errors: string[] = [];
  let message = '';

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['invalid_type'],
      message: 'La contraseña debe ser una cadena de texto'
    };
  }

  // Validar longitud mínima
  if (password.length < 8) {
    errors.push('length');
  }

  // Validar mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('uppercase');
  }

  // Validar minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('lowercase');
  }

  // Validar número
  if (!/\d/.test(password)) {
    errors.push('number');
  }

  // Validar carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('special');
  }

  // Generar mensaje de error
  if (errors.length > 0) {
    const errorMessages = {
      length: 'al menos 8 caracteres',
      uppercase: 'al menos una letra mayúscula',
      lowercase: 'al menos una letra minúscula',
      number: 'al menos un número',
      special: 'al menos un carácter especial'
    };

    message = `La contraseña debe contener: ${errors.map(e => errorMessages[e as keyof typeof errorMessages]).join(', ')}`;
  }

  return {
    isValid: errors.length === 0,
    errors,
    message
  };
}

// ===================================
// VALIDACIÓN DE TELÉFONO
// ===================================

export function validatePhone(phone: any, country: 'AR' | 'INTERNATIONAL' = 'AR'): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Limpiar el teléfono de espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (country === 'AR') {
    // Validar teléfonos argentinos
    // Formatos válidos: +541123456789, 1123456789, 01123456789
    const argPhoneRegex = /^(\+54)?0?11\d{8}$|^(\+54)?0?\d{10}$/;
    return argPhoneRegex.test(cleanPhone);
  }

  if (country === 'INTERNATIONAL') {
    // Validar formato internacional básico
    const intPhoneRegex = /^\+\d{10,15}$/;
    return intPhoneRegex.test(cleanPhone);
  }

  return false;
}

// ===================================
// VALIDACIÓN DE DATOS DE PRODUCTO
// ===================================

export function validateProductData(product: any): ValidationResult {
  const errors: string[] = [];

  if (!product || typeof product !== 'object') {
    return {
      isValid: false,
      errors: ['invalid_type'],
      message: 'Los datos del producto deben ser un objeto'
    };
  }

  // Validar nombre
  if (!product.name || typeof product.name !== 'string') {
    errors.push('name');
  } else if (product.name.length < 3 || product.name.length > 200) {
    errors.push('name_length');
  } else if (/<script|javascript:|on\w+=/i.test(product.name)) {
    errors.push('name_security');
  }

  // Validar precio
  if (typeof product.price !== 'number' || product.price <= 0) {
    errors.push('price');
  } else if (product.price > 9999999) {
    errors.push('price_too_high');
  }

  // Validar stock
  if (typeof product.stock !== 'number' || product.stock < 0) {
    errors.push('stock');
  }

  // Validar categoría
  if (!product.category_id || typeof product.category_id !== 'number') {
    errors.push('category_id');
  }

  // Validar marca
  if (!product.brand || typeof product.brand !== 'string') {
    errors.push('brand');
  }

  // Validar imágenes
  if (!Array.isArray(product.images) || product.images.length === 0) {
    errors.push('images');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===================================
// VALIDACIÓN DE DATOS DE ORDEN
// ===================================

export function validateOrderData(order: any): ValidationResult {
  const errors: string[] = [];

  if (!order || typeof order !== 'object') {
    return {
      isValid: false,
      errors: ['invalid_type']
    };
  }

  // Validar user_id
  if (!order.user_id || typeof order.user_id !== 'string') {
    errors.push('user_id');
  }

  // Validar items
  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('items_empty');
  } else {
    // Validar cada item
    order.items.forEach((item: any, index: number) => {
      if (!item.product_id || typeof item.product_id !== 'number') {
        errors.push(`item_${index}_product_id`);
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`item_${index}_quantity`);
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        errors.push(`item_${index}_price`);
      }
    });
  }

  // Validar total
  if (typeof order.total !== 'number' || order.total <= 0) {
    errors.push('total');
  } else if (Array.isArray(order.items) && order.items.length > 0) {
    // Verificar que el total coincida con la suma de items
    const calculatedTotal = order.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    if (Math.abs(calculatedTotal - order.total) > 0.01) {
      errors.push('total_mismatch');
    }
  }

  // Validar dirección de envío
  const addressValidation = validateAddress(order.shipping_address);
  if (!addressValidation.isValid) {
    errors.push('shipping_address');
  }

  // Validar método de pago
  if (!order.payment_method || typeof order.payment_method !== 'string') {
    errors.push('payment_method');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===================================
// VALIDACIÓN DE DATOS DE PAGO
// ===================================

export function validatePaymentData(payment: any): ValidationResult {
  const errors: string[] = [];

  if (!payment || typeof payment !== 'object') {
    return {
      isValid: false,
      errors: ['invalid_type']
    };
  }

  // Validar método
  if (!payment.method || typeof payment.method !== 'string') {
    errors.push('method');
  }

  // Validar monto
  if (typeof payment.amount !== 'number' || payment.amount <= 0) {
    errors.push('amount');
  }

  // Validar moneda
  if (!validateCurrency(payment.currency)) {
    errors.push('currency');
  }

  // Validaciones específicas para MercadoPago
  if (payment.method === 'mercadopago') {
    if (payment.payer && !validateEmail(payment.payer.email)) {
      errors.push('payer_email');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===================================
// VALIDACIÓN DE DIRECCIÓN
// ===================================

export function validateAddress(address: any): ValidationResult {
  const errors: string[] = [];

  if (!address || typeof address !== 'object') {
    return {
      isValid: false,
      errors: ['invalid_type']
    };
  }

  // Validar campos requeridos básicos
  const requiredFields = ['street', 'city', 'postal_code', 'country'];
  requiredFields.forEach(field => {
    if (!address[field] || typeof address[field] !== 'string' || address[field].trim() === '') {
      errors.push(field);
    }
  });

  // Validar código postal por país
  if (address.country && address.postal_code) {
    const postalCodeValid = validatePostalCode(address.postal_code, address.country);
    if (!postalCodeValid) {
      errors.push('postal_code_format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===================================
// VALIDACIÓN DE CÓDIGO POSTAL
// ===================================

function validatePostalCode(postalCode: string, country: string): boolean {
  const patterns: { [key: string]: RegExp } = {
    'Argentina': /^\d{4}$/,
    'USA': /^\d{5}(-\d{4})?$/,
    'US': /^\d{5}(-\d{4})?$/,
    'Brazil': /^\d{5}-\d{3}$/,
    'Chile': /^\d{7}$/,
    'Canada': /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    'UK': /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i,
    'Germany': /^\d{5}$/,
    'France': /^\d{5}$/,
    'Spain': /^\d{5}$/,
    'Italy': /^\d{5}$/,
    'Mexico': /^\d{5}$/
  };

  const pattern = patterns[country];
  return pattern ? pattern.test(postalCode) : true; // Si no hay patrón, aceptar
}

// ===================================
// VALIDACIÓN DE MONEDA
// ===================================

export function validateCurrency(currency: any): boolean {
  if (!currency || typeof currency !== 'string') {
    return false;
  }

  const supportedCurrencies = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'];
  return supportedCurrencies.includes(currency.toUpperCase());
}

// ===================================
// VALIDACIÓN DE CANTIDAD
// ===================================

export function validateQuantity(quantity: any): boolean {
  if (typeof quantity !== 'number') {
    return false;
  }

  // Debe ser un entero positivo
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return false;
  }

  // Límite máximo de cantidad
  if (quantity > 999) {
    return false;
  }

  return true;
}

// ===================================
// VALIDACIÓN DE DESCUENTO
// ===================================

export function validateDiscount(discount: any): boolean {
  if (!discount || typeof discount !== 'object') {
    return false;
  }

  // Validar tipo
  if (!['percentage', 'fixed'].includes(discount.type)) {
    return false;
  }

  // Validar valor
  if (typeof discount.value !== 'number' || discount.value < 0) {
    return false;
  }

  // Validaciones específicas por tipo
  if (discount.type === 'percentage') {
    // Porcentaje no puede ser mayor a 100
    if (discount.value > 100) {
      return false;
    }
  }

  if (discount.type === 'fixed') {
    // Descuento fijo debe tener moneda
    if (!discount.currency || !validateCurrency(discount.currency)) {
      return false;
    }
  }

  return true;
}

// ===================================
// UTILIDADES ADICIONALES
// ===================================

/**
 * Sanitiza una cadena de texto removiendo caracteres peligrosos
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remover scripts
    .replace(/<[^>]*>/g, '') // Remover HTML tags
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
}

/**
 * Valida que un objeto tenga todas las propiedades requeridas
 */
export function validateRequiredFields(obj: any, requiredFields: string[]): ValidationResult {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return {
      isValid: false,
      errors: ['invalid_object']
    };
  }

  requiredFields.forEach(field => {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined || obj[field] === '') {
      errors.push(field);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un rango numérico
 */
export function validateNumberRange(value: any, min: number, max: number): boolean {
  if (typeof value !== 'number') {
    return false;
  }

  return value >= min && value <= max;
}

/**
 * Valida una fecha
 */
export function validateDate(date: any): boolean {
  if (!date) {
    return false;
  }

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Valida una URL
 */
export function validateURL(url: any): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}