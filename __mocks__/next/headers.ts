/**
 * Mock de next/headers para tests
 * Evita la verificación del request store de Next.js
 * 
 * IMPORTANTE: Este mock debe retornar una Promise que resuelve a Headers
 * para que funcione con el código que usa `await headers()`
 * 
 * Usamos una función que retorna directamente sin pasar por el request store
 */

// Crear el mock que retorna una Promise
const mockHeadersFn = jest.fn(() => Promise.resolve(new Headers()))

export const headers = mockHeadersFn
