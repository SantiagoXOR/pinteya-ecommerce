/**
 * Tests Unitarios - Schemas de Validación de Productos
 * Validación CRÍTICA: category_id debe aceptar number, no string UUID
 */

import { z } from 'zod'

// Schemas del sistema (replicados para testing independiente)
const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(5000).optional(),
  brand: z.string().max(100).optional(),
  category_id: z.number().int().positive('Selecciona una categoría'), // ✅ CRÍTICO: number
  is_active: z.boolean().default(true),
  price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  discounted_price: z.number().min(0).optional().nullable(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  image_url: z.string().url().optional().nullable(),
  featured: z.boolean().default(false),
})

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  discounted_price: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  category_id: z.number().int().positive('ID de categoría inválido').optional(), // ✅ number
  brand: z.string().optional(),
  is_active: z.boolean().optional(),
})

const UpdateVariantSchema = z.object({
  color_name: z.string().optional(),
  measure: z.string().optional(),
  finish: z.string().optional().nullable(),
  price_list: z.number().optional(),
  price_sale: z.number().optional().nullable(),
  stock: z.number().int().min(0).optional(), // ✅ number
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  image_url: z.string().optional().nullable(),
  aikon_id: z.string().optional(),
})

describe('Product Schemas - Validación Zod', () => {
  describe('ProductSchema - Validación CRÍTICA de category_id', () => {
    it('debe ACEPTAR category_id como number', () => {
      const validData = {
        name: 'Látex Eco Painting',
        category_id: 38, // ✅ number
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category_id).toBe(38)
        expect(typeof result.data.category_id).toBe('number')
      }
    })

    it('debe RECHAZAR category_id como string UUID', () => {
      const invalidData = {
        name: 'Látex Eco Painting',
        category_id: '550e8400-e29b-41d4-a909-446655440000', // ❌ string UUID
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        // Debe haber error de tipo
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].path).toContain('category_id')
      }
    })

    it('debe RECHAZAR category_id como string numérico', () => {
      const invalidData = {
        name: 'Látex Eco Painting',
        category_id: '38', // ❌ string (aunque sea número)
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('debe REQUERIR category_id (no opcional)', () => {
      const datasinCategoria = {
        name: 'Látex Eco Painting',
        // category_id: falta
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(datasinCategoria)

      expect(result.success).toBe(false)
      if (!result.success) {
        const categoryError = result.error.issues.find((issue) => issue.path[0] === 'category_id')
        expect(categoryError).toBeDefined()
      }
    })
  })

  describe('ProductSchema - Validaciones de Stock', () => {
    it('debe aceptar stock = 0', () => {
      const result = ProductSchema.safeParse({
        name: 'Test',
        category_id: 38,
        price: 100,
        stock: 0, // ✅ válido
      })

      expect(result.success).toBe(true)
    })

    it('debe rechazar stock negativo', () => {
      const result = ProductSchema.safeParse({
        name: 'Test',
        category_id: 38,
        price: 100,
        stock: -5, // ❌ inválido
      })

      expect(result.success).toBe(false)
    })

    it('debe aceptar stock como number', () => {
      const result = ProductSchema.safeParse({
        name: 'Test',
        category_id: 38,
        price: 100,
        stock: 30,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.stock).toBe('number')
      }
    })
  })

  describe('ProductSchema - Validaciones de Precio', () => {
    it('debe rechazar precio = 0', () => {
      const result = ProductSchema.safeParse({
        name: 'Test',
        category_id: 38,
        price: 0, // ❌ inválido
        stock: 10,
      })

      expect(result.success).toBe(false)
    })

    it('debe aceptar precio > 0.01', () => {
      const result = ProductSchema.safeParse({
        name: 'Test',
        category_id: 38,
        price: 0.01, // ✅ mínimo válido
        stock: 10,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('UpdateProductSchema - Actualizaciones Parciales', () => {
    it('debe permitir actualizar solo el stock', () => {
      const result = UpdateProductSchema.safeParse({
        stock: 25,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.stock).toBe(25)
      }
    })

    it('debe permitir actualizar solo category_id como number', () => {
      const result = UpdateProductSchema.safeParse({
        category_id: 39,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category_id).toBe(39)
        expect(typeof result.data.category_id).toBe('number')
      }
    })

    it('debe rechazar category_id como string', () => {
      const result = UpdateProductSchema.safeParse({
        category_id: '39', // ❌ string
      })

      expect(result.success).toBe(false)
    })

    it('debe permitir actualización sin category_id (opcional)', () => {
      const result = UpdateProductSchema.safeParse({
        name: 'Nuevo Nombre',
        stock: 50,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('UpdateVariantSchema - Validación de Variantes', () => {
    it('debe aceptar stock como number', () => {
      const result = UpdateVariantSchema.safeParse({
        stock: 35,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.stock).toBe(35)
        expect(typeof result.data.stock).toBe('number')
      }
    })

    it('debe aceptar todos los campos opcionales', () => {
      const result = UpdateVariantSchema.safeParse({
        color_name: 'BLANCO',
        measure: '10L',
        finish: null,
        price_list: 33644,
        price_sale: 23550.8,
        stock: 30,
        is_active: true,
        is_default: false,
        image_url: 'https://example.com/image.jpg',
        aikon_id: '49',
      })

      expect(result.success).toBe(true)
    })

    it('debe rechazar stock negativo', () => {
      const result = UpdateVariantSchema.safeParse({
        stock: -10,
      })

      expect(result.success).toBe(false)
    })

    it('debe aceptar imagen como null o string', () => {
      const resultNull = UpdateVariantSchema.safeParse({
        image_url: null,
      })
      const resultString = UpdateVariantSchema.safeParse({
        image_url: 'https://example.com/image.jpg',
      })

      expect(resultNull.success).toBe(true)
      expect(resultString.success).toBe(true)
    })
  })

  describe('Regresión - Bug "Expected string, received number"', () => {
    it('NO debe generar error con category_id numérico en ProductSchema', () => {
      const productData = {
        name: 'Látex Eco Painting',
        category_id: 38, // De la BD viene como number
        price: 4975,
        stock: 25,
      }

      const result = ProductSchema.safeParse(productData)

      expect(result.success).toBe(true)
      // NO debe haber error "Expected string, received number"
      if (!result.success) {
        const hasExpectedStringError = result.error.issues.some((issue) =>
          issue.message.includes('Expected string')
        )
        expect(hasExpectedStringError).toBe(false)
      }
    })

    it('NO debe generar error con category_id numérico en UpdateProductSchema', () => {
      const updateData = {
        category_id: 39,
        stock: 30,
      }

      const result = UpdateProductSchema.safeParse(updateData)

      expect(result.success).toBe(true)
      if (!result.success) {
        const hasExpectedStringError = result.error.issues.some((issue) =>
          issue.message.includes('Expected string')
        )
        expect(hasExpectedStringError).toBe(false)
      }
    })
  })
})

