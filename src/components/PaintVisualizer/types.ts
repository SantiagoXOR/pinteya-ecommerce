/**
 * Tipos e interfaces para Paint Visualizer AR
 */

// Producto con información de pintura
export interface PaintProduct {
  id: number
  name: string
  brand?: string
  image?: string
  colors: PaintColor[]
}

// Color de pintura
export interface PaintColor {
  name: string
  hex: string
  variantId?: number
}

// Request para generar visualización
export interface PaintRequest {
  imageBase64: string
  colorHex: string
  colorName: string
  productName?: string
  productId?: number
  maskData?: PaintMaskArea[]
}

// Área de máscara para pintar
export interface PaintMaskArea {
  x: number
  y: number
  width: number
  height: number
}

// Respuesta de la API
export interface PaintResponse {
  success: boolean
  analysis?: string
  error?: string
  rateLimit?: {
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }
}

// Props del componente principal
export interface PaintVisualizerProps {
  isOpen: boolean
  onClose: () => void
  productName?: string
  productCategory?: string
}

// Props del componente Card
export interface PaintVisualizerCardProps {
  className?: string
  productName?: string
  productCategory?: string
}

// Estado del visualizador
export interface PaintVisualizerState {
  selectedProduct: PaintProduct | null
  selectedColor: PaintColor | null
  imageSrc: string | null
  paintedImage: string | null
  isDrawing: boolean
  isProcessing: boolean
  error: string | null
}

