/**
 * ShopDetailModal - Re-exportación del componente modularizado
 * 
 * Este archivo mantiene la compatibilidad hacia atrás re-exportando
 * el componente desde la nueva estructura modularizada.
 * 
 * NOTA: Este archivo está en ShopDetails/ShopDetailModal.tsx
 * y el componente real está en ShopDetails/ShopDetailModal/index.tsx
 * 
 * IMPORTANTE: Usamos una ruta absoluta para evitar referencias circulares
 */

'use client'

// Re-exportar directamente desde el index de la carpeta ShopDetailModal
// Usar ruta absoluta para evitar referencias circulares
export { ShopDetailModal, default } from '@/components/ShopDetails/ShopDetailModal/index'
export type { ShopDetailModalProps, Product } from '@/components/ShopDetails/ShopDetailModal/types'
