// =====================================================
// UTILIDADES: VALIDACIÓN DE DATOS
// Descripción: Funciones para validar datos de logística
// Basado en: Zod + patrones enterprise
// =====================================================

import { z } from 'zod';

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

export const addressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  apartment: z.string().optional(),
  neighborhood: z.string().min(1, 'El barrio es requerido'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'La provincia es requerida'),
  postal_code: z.string().min(4, 'El código postal debe tener al menos 4 dígitos'),
  country: z.string().default('AR'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reference: z.string().optional()
});

export const shipmentSchema = z.object({
  tracking_number: z.string().min(1, 'El número de tracking es requerido'),
  courier_id: z.number().min(1, 'El courier es requerido'),
  service_type: z.enum(['standard', 'express', 'next_day', 'same_day']),
  origin_address: addressSchema,
  destination_address: addressSchema,
  package_details: z.object({
    weight: z.number().min(0.1, 'El peso debe ser mayor a 0'),
    dimensions: z.object({
      length: z.number().min(1, 'El largo debe ser mayor a 0'),
      width: z.number().min(1, 'El ancho debe ser mayor a 0'),
      height: z.number().min(1, 'La altura debe ser mayor a 0')
    }),
    declared_value: z.number().min(0, 'El valor declarado debe ser mayor o igual a 0'),
    description: z.string().min(1, 'La descripción es requerida')
  }),
  estimated_delivery: z.string().optional(),
  special_instructions: z.string().optional()
});

// =====================================================
// FUNCIONES DE VALIDACIÓN
// =====================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  // Formato argentino: +54 9 351 123 4567, +54 351 123-4567, 351 123 4567, etc.
  // Limpiar el teléfono de espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Patrones aceptados:
  // +54351234567 (con código país)
  // +549351234567 (con código país y 9)
  // 351234567 (sin código país)
  const phoneRegex = /^(\+54(9)?)?\d{10}$|^\d{10}$/;

  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

export function validateDNI(dni: string): boolean {
  // Limpiar el DNI de espacios, guiones y puntos
  const cleanDNI = dni.replace(/[\s\-\.]/g, '');

  // Patrones aceptados:
  // DNI: 8 dígitos (12345678)
  // CUIT: 11 dígitos (20123456789)
  const dniRegex = /^\d{8}$/;
  const cuitRegex = /^\d{11}$/;

  if (dniRegex.test(cleanDNI)) {
    // Validar DNI (8 dígitos)
    return cleanDNI.length === 8 && parseInt(cleanDNI) > 0;
  } else if (cuitRegex.test(cleanDNI)) {
    // Validar CUIT (11 dígitos) - validación básica
    return cleanDNI.length === 11 && parseInt(cleanDNI) > 0;
  }

  return false;
}

export function validatePostalCode(postalCode: string): boolean {
  // Código postal argentino: 4 dígitos
  const postalCodeRegex = /^\d{4}$/;
  return postalCodeRegex.test(postalCode);
}

export function validateTrackingNumber(trackingNumber: string): boolean {
  // Formato general: al menos 6 caracteres alfanuméricos
  const trackingRegex = /^[A-Z0-9]{6,}$/i;
  return trackingRegex.test(trackingNumber);
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

export function validateWeight(weight: number): boolean {
  return weight > 0 && weight <= 1000; // Máximo 1000kg
}

export function validateDimensions(dimensions: {
  length: number;
  width: number;
  height: number;
}): boolean {
  const { length, width, height } = dimensions;
  return (
    length > 0 && length <= 200 && // Máximo 200cm
    width > 0 && width <= 200 &&
    height > 0 && height <= 200
  );
}

// =====================================================
// VALIDACIONES DE NEGOCIO
// =====================================================

export function validateDeliveryDate(date: string): boolean {
  const deliveryDate = new Date(date);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30); // Máximo 30 días
  
  return deliveryDate >= today && deliveryDate <= maxDate;
}

export function validateShippingCost(cost: number): boolean {
  return cost >= 0 && cost <= 100000; // Máximo $100,000
}

export function validatePackageValue(value: number): boolean {
  return value >= 0 && value <= 1000000; // Máximo $1,000,000
}

// =====================================================
// SANITIZACIÓN DE DATOS
// =====================================================

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function sanitizePostalCode(postalCode: string): string {
  return postalCode.replace(/\D/g, '').substring(0, 4);
}

export function sanitizeTrackingNumber(trackingNumber: string): string {
  return trackingNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// =====================================================
// TIPOS DE VALIDACIÓN
// =====================================================

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function validateAddress(address: any): ValidationResult {
  try {
    addressSchema.parse(address);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return { isValid: false, errors: ['Error de validación desconocido'] };
  }
}

export function validateShipment(shipment: any): ValidationResult {
  try {
    shipmentSchema.parse(shipment);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return { isValid: false, errors: ['Error de validación desconocido'] };
  }
}
