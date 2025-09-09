// ===================================
// PINTEYA E-COMMERCE - TESTS PARA VALIDATION UTILS
// ===================================

import { validateEmail, validatePhoneNumber } from '@/lib/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.ar')).toBe(true);
      expect(validateEmail('juan.perez@test.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate Argentine phone formats', () => {
      // Formato que causó el error en el reporte
      expect(validatePhoneNumber('+54 351 123-4567')).toBe(true);
      
      // Otros formatos válidos
      expect(validatePhoneNumber('+54 9 351 123 4567')).toBe(true);
      expect(validatePhoneNumber('+54 351 123 4567')).toBe(true);
      expect(validatePhoneNumber('351 123 4567')).toBe(true);
      expect(validatePhoneNumber('3511234567')).toBe(true);
      expect(validatePhoneNumber('+543511234567')).toBe(true);
      expect(validatePhoneNumber('+5493511234567')).toBe(true);
    });

    it('should reject invalid phone formats', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abc123456789')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('12345')).toBe(false);
    });

    it('should handle phone numbers with various separators', () => {
      expect(validatePhoneNumber('+54-351-123-4567')).toBe(true);
      expect(validatePhoneNumber('+54 (351) 123-4567')).toBe(true);
      expect(validatePhoneNumber('351-123-4567')).toBe(true);
    });
  });
});