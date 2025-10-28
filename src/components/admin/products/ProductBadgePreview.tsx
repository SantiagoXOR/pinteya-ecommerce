'use client'

import { Badge } from '@/components/ui/badge'
import { AdminCard } from '../ui/AdminCard'
import { Sparkles, Tag, TrendingUp, Package, AlertTriangle, XCircle } from 'lucide-react'

interface ProductBadgePreviewProps {
  product: {
    created_at: string
    featured?: boolean
    price: number
    compare_price?: number
    stock: number
  }
}

interface ProductBadge {
  type: string
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
  icon: React.ReactNode
}

function calculateBadges(product: ProductBadgePreviewProps['product']): ProductBadge[] {
  const badges: ProductBadge[] = []
  
  // 1. NUEVO (< 30 días)
  const createdDate = new Date(product.created_at)
  const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceCreation < 30) {
    badges.push({
      type: 'new',
      label: '🆕 NUEVO',
      variant: 'default',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Sparkles className="w-3 h-3" />
    })
  }
  
  // 2. DESTACADO
  if (product.featured) {
    badges.push({
      type: 'featured',
      label: '⭐ DESTACADO',
      variant: 'default',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: <Tag className="w-3 h-3" />
    })
  }
  
  // 3. OFERTA (descuento)
  if (product.compare_price && product.compare_price > product.price) {
    const discount = Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    badges.push({
      type: 'sale',
      label: `💥 -${discount}% OFF`,
      variant: 'destructive',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <TrendingUp className="w-3 h-3" />
    })
  }
  
  // 4. SIN STOCK (prioridad sobre stock bajo)
  if (product.stock === 0) {
    badges.push({
      type: 'out-of-stock',
      label: '❌ SIN STOCK',
      variant: 'destructive',
      color: 'bg-red-600 text-white border-red-700',
      icon: <XCircle className="w-3 h-3" />
    })
  }
  // 5. STOCK BAJO
  else if (product.stock > 0 && product.stock <= 10) {
    badges.push({
      type: 'low-stock',
      label: `📦 ÚLTIMAS ${product.stock} UNIDADES`,
      variant: 'outline',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: <AlertTriangle className="w-3 h-3" />
    })
  }
  
  return badges
}

export function ProductBadgePreview({ product }: ProductBadgePreviewProps) {
  const badges = calculateBadges(product)
  
  return (
    <AdminCard title="Vista Previa - Badges del Producto" className="bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Así se verá el producto en la tienda:
        </p>
        
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.type}
                className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-full border ${badge.color}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Package className="w-4 h-4" />
            <span>Sin badges especiales. Producto estándar.</span>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 <strong>Tip:</strong> Los badges ayudan a destacar productos y aumentar conversiones.
          </p>
        </div>
      </div>
    </AdminCard>
  )
}

