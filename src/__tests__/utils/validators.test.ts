// ===================================
// TESTS UNITARIOS: Validadores
// Tests para funciones de validación críticas
// ===================================

import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateProductData,
  validateOrderData,
  validatePaymentData,
  validateAddress,
  validateCurrency,
  validateQuantity,
  validateDiscount,
} from '@/lib/utils/validators'

describe('Email Validation', () => {
  test('should validate correct email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'user123@test-domain.com',
    ]

    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true)
    })
  })

  test('should reject invalid email formats', () => {
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user..name@domain.com',
      'user@domain',
      '',
      null,
      undefined,
    ]

    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false)
    })
  })

  test('should handle edge cases', () => {
    expect(validateEmail('a@b.co')).toBe(true) // Minimum valid
    expect(validateEmail('a'.repeat(64) + '@' + 'b'.repeat(63) + '.com')).toBe(true) // Max length
    expect(validateEmail('a'.repeat(65) + '@domain.com')).toBe(false) // Too long local part
  })
})

describe('Password Validation', () => {
  test('should validate strong passwords', () => {
    const strongPasswords = [
      'MyStr0ngP@ssw0rd!',
      'C0mpl3x#P@ssw0rd',
      'S3cur3P@ss123!',
      'V3ryStr0ng#2024',
    ]

    strongPasswords.forEach(password => {
      const result = validatePassword(password)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  test('should reject weak passwords', () => {
    const weakPasswords = [
      { password: '123456', expectedErrors: ['length', 'uppercase', 'lowercase', 'special'] },
      { password: 'password', expectedErrors: ['uppercase', 'number', 'special'] },
      { password: 'PASSWORD', expectedErrors: ['lowercase', 'number', 'special'] },
      { password: 'Pass123', expectedErrors: ['length', 'special'] },
      { password: 'Pass@', expectedErrors: ['length', 'number'] },
    ]

    weakPasswords.forEach(({ password, expectedErrors }) => {
      const result = validatePassword(password)
      expect(result.isValid).toBe(false)
      expectedErrors.forEach(error => {
        expect(result.errors).toContain(error)
      })
    })
  })

  test('should provide detailed error messages', () => {
    const result = validatePassword('weak')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('length')
    expect(result.message).toContain('al menos 8 caracteres')
  })
})

describe('Phone Validation', () => {
  test('should validate Argentine phone numbers', () => {
    const validPhones = [
      '+541123456789',
      '1123456789',
      '011-2345-6789',
      '(011) 2345-6789',
      '+54 11 2345-6789',
    ]

    validPhones.forEach(phone => {
      expect(validatePhone(phone, 'AR')).toBe(true)
    })
  })

  test('should validate international phone numbers', () => {
    const validPhones = ['+1234567890', '+44 20 7946 0958', '+33 1 42 86 83 26']

    validPhones.forEach(phone => {
      expect(validatePhone(phone, 'INTERNATIONAL')).toBe(true)
    })
  })

  test('should reject invalid phone numbers', () => {
    const invalidPhones = ['123', 'abc123', '+54 11 123', '', null, undefined]

    invalidPhones.forEach(phone => {
      expect(validatePhone(phone, 'AR')).toBe(false)
    })
  })
})

describe('Product Data Validation', () => {
  const validProduct = {
    name: 'Pintura Latex Interior',
    description: 'Pintura de alta calidad para interiores',
    price: 2500,
    stock: 10,
    category_id: 1,
    brand: 'Sherwin Williams',
    images: ['image1.jpg', 'image2.jpg'],
  }

  test('should validate correct product data', () => {
    const result = validateProductData(validProduct)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject product with missing required fields', () => {
    const invalidProduct = { ...validProduct }
    delete invalidProduct.name
    delete invalidProduct.price

    const result = validateProductData(invalidProduct)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('name')
    expect(result.errors).toContain('price')
  })

  test('should validate price constraints', () => {
    const negativePrice = { ...validProduct, price: -100 }
    const zeroPrice = { ...validProduct, price: 0 }
    const tooHighPrice = { ...validProduct, price: 10000000 }

    expect(validateProductData(negativePrice).isValid).toBe(false)
    expect(validateProductData(zeroPrice).isValid).toBe(false)
    expect(validateProductData(tooHighPrice).isValid).toBe(false)
  })

  test('should validate stock constraints', () => {
    const negativeStock = { ...validProduct, stock: -1 }
    const validZeroStock = { ...validProduct, stock: 0 }

    expect(validateProductData(negativeStock).isValid).toBe(false)
    expect(validateProductData(validZeroStock).isValid).toBe(true)
  })

  test('should validate name length and format', () => {
    const shortName = { ...validProduct, name: 'AB' }
    const longName = { ...validProduct, name: 'A'.repeat(201) }
    const invalidChars = { ...validProduct, name: 'Product<script>' }

    expect(validateProductData(shortName).isValid).toBe(false)
    expect(validateProductData(longName).isValid).toBe(false)
    expect(validateProductData(invalidChars).isValid).toBe(false)
  })
})

describe('Order Data Validation', () => {
  const validOrder = {
    user_id: 'user_123',
    items: [
      { product_id: 1, quantity: 2, price: 2500 },
      { product_id: 2, quantity: 1, price: 1800 },
    ],
    total: 6800,
    shipping_address: {
      street: 'Av. Corrientes 1234',
      city: 'Buenos Aires',
      state: 'CABA',
      postal_code: '1043',
      country: 'Argentina',
    },
    payment_method: 'mercadopago',
  }

  test('should validate correct order data', () => {
    const result = validateOrderData(validOrder)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should validate order items', () => {
    const emptyItems = { ...validOrder, items: [] }
    const invalidItem = {
      ...validOrder,
      items: [{ product_id: 1, quantity: 0, price: -100 }],
    }

    expect(validateOrderData(emptyItems).isValid).toBe(false)
    expect(validateOrderData(invalidItem).isValid).toBe(false)
  })

  test('should validate total calculation', () => {
    const wrongTotal = { ...validOrder, total: 5000 } // Should be 6800
    const result = validateOrderData(wrongTotal)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('total_mismatch')
  })

  test('should validate shipping address', () => {
    const invalidAddress = {
      ...validOrder,
      shipping_address: {
        street: '',
        city: 'Buenos Aires',
        state: 'CABA',
        postal_code: '1043',
        country: 'Argentina',
      },
    }

    const result = validateOrderData(invalidAddress)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('shipping_address')
  })
})

describe('Payment Data Validation', () => {
  test('should validate MercadoPago payment data', () => {
    const validPayment = {
      method: 'mercadopago',
      amount: 6800,
      currency: 'ARS',
      payment_method_id: 'visa',
      installments: 1,
      payer: {
        email: 'user@example.com',
        identification: {
          type: 'DNI',
          number: '12345678',
        },
      },
    }

    const result = validatePaymentData(validPayment)
    expect(result.isValid).toBe(true)
  })

  test('should validate payment amount', () => {
    const negativeAmount = {
      method: 'mercadopago',
      amount: -100,
      currency: 'ARS',
    }

    const result = validatePaymentData(negativeAmount)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('amount')
  })

  test('should validate currency format', () => {
    const invalidCurrency = {
      method: 'mercadopago',
      amount: 1000,
      currency: 'INVALID',
    }

    const result = validatePaymentData(invalidCurrency)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('currency')
  })
})

describe('Address Validation', () => {
  test('should validate complete address', () => {
    const validAddress = {
      street: 'Av. Corrientes 1234',
      city: 'Buenos Aires',
      state: 'CABA',
      postal_code: '1043',
      country: 'Argentina',
    }

    const result = validateAddress(validAddress)
    expect(result.isValid).toBe(true)
  })

  test('should validate postal codes by country', () => {
    const argPostalCode = {
      street: '123 Main St',
      city: 'Buenos Aires',
      country: 'Argentina',
      postal_code: '1043',
    }
    const usPostalCode = {
      street: '456 Oak Ave',
      city: 'New York',
      country: 'USA',
      postal_code: '12345',
    }
    const invalidPostalCode = {
      street: '789 Pine St',
      city: 'Córdoba',
      country: 'Argentina',
      postal_code: '123',
    }

    expect(validateAddress(argPostalCode).isValid).toBe(true)
    expect(validateAddress(usPostalCode).isValid).toBe(true)
    expect(validateAddress(invalidPostalCode).isValid).toBe(false)
  })
})

describe('Currency Validation', () => {
  test('should validate supported currencies', () => {
    const supportedCurrencies = ['ARS', 'USD', 'EUR', 'BRL']

    supportedCurrencies.forEach(currency => {
      expect(validateCurrency(currency)).toBe(true)
    })
  })

  test('should reject unsupported currencies', () => {
    const unsupportedCurrencies = ['XYZ', 'ABC', '', null, undefined]

    unsupportedCurrencies.forEach(currency => {
      expect(validateCurrency(currency)).toBe(false)
    })
  })
})

describe('Quantity Validation', () => {
  test('should validate positive quantities', () => {
    const validQuantities = [1, 5, 10, 100]

    validQuantities.forEach(quantity => {
      expect(validateQuantity(quantity)).toBe(true)
    })
  })

  test('should reject invalid quantities', () => {
    const invalidQuantities = [0, -1, 1.5, 'abc', null, undefined]

    invalidQuantities.forEach(quantity => {
      expect(validateQuantity(quantity)).toBe(false)
    })
  })

  test('should validate quantity limits', () => {
    expect(validateQuantity(999)).toBe(true)
    expect(validateQuantity(1000)).toBe(false) // Assuming max is 999
  })
})

describe('Discount Validation', () => {
  test('should validate percentage discounts', () => {
    const validDiscounts = [
      { type: 'percentage', value: 10 },
      { type: 'percentage', value: 50 },
      { type: 'percentage', value: 100 },
    ]

    validDiscounts.forEach(discount => {
      expect(validateDiscount(discount)).toBe(true)
    })
  })

  test('should validate fixed amount discounts', () => {
    const validDiscounts = [
      { type: 'fixed', value: 100, currency: 'ARS' },
      { type: 'fixed', value: 50, currency: 'USD' },
    ]

    validDiscounts.forEach(discount => {
      expect(validateDiscount(discount)).toBe(true)
    })
  })

  test('should reject invalid discounts', () => {
    const invalidDiscounts = [
      { type: 'percentage', value: -10 },
      { type: 'percentage', value: 150 },
      { type: 'fixed', value: -100 },
      { type: 'invalid', value: 10 },
    ]

    invalidDiscounts.forEach(discount => {
      expect(validateDiscount(discount)).toBe(false)
    })
  })
})

// Tests de integración para validadores
describe('Validator Integration', () => {
  test('should validate complete user registration data', () => {
    const userData = {
      email: 'user@example.com',
      password: 'MyStr0ng#P@ssw0rd',
      phone: '+541123456789',
      address: {
        street: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        state: 'CABA',
        postal_code: '1043',
        country: 'Argentina',
      },
    }

    expect(validateEmail(userData.email)).toBe(true)
    expect(validatePassword(userData.password).isValid).toBe(true)
    expect(validatePhone(userData.phone, 'AR')).toBe(true)
    expect(validateAddress(userData.address).isValid).toBe(true)
  })

  test('should validate complete checkout flow data', () => {
    const checkoutData = {
      order: {
        user_id: 'user_123',
        items: [{ product_id: 1, quantity: 2, price: 2500 }],
        total: 5000,
        shipping_address: {
          street: 'Av. Corrientes 1234',
          city: 'Buenos Aires',
          state: 'CABA',
          postal_code: '1043',
          country: 'Argentina',
        },
        payment_method: 'mercadopago',
      },
      payment: {
        method: 'mercadopago',
        amount: 5000,
        currency: 'ARS',
      },
    }

    expect(validateOrderData(checkoutData.order).isValid).toBe(true)
    expect(validatePaymentData(checkoutData.payment).isValid).toBe(true)
  })
})
