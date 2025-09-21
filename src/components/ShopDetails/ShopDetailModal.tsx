'use client';

import React from 'react';
import { QuickViewModal } from '@/components/ui/modal';
import { useShopDetailsReducer } from '@/hooks/optimization/useShopDetailsReducer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/core/utils';

// ===================================
// TIPOS
// ===================================

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand: string;
  stock: number;
  description?: string;
  colors?: string[];
  capacities?: string[];
}

interface ShopDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (product: Product, variants: any) => void;
  onAddToWishlist?: (product: Product) => void;
}

// ===================================
// COMPONENTES DE SELECTORES
// ===================================

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColor,
  onColorChange
}) => {
  const colorMap: Record<string, string> = {
    'blanco': '#FFFFFF',
    'negro': '#000000',
    'rojo': '#DC2626',
    'azul': '#2563EB',
    'verde': '#16A34A',
    'amarillo': '#EAB308',
    'naranja': '#EA580C',
    'gris': '#6B7280',
    'marron': '#92400E',
    'rosa': '#EC4899'
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Color</h4>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all duration-200",
              selectedColor === color 
                ? "border-blaze-orange-500 ring-2 ring-blaze-orange-200" 
                : "border-gray-300 hover:border-gray-400"
            )}
            style={{ 
              backgroundColor: colorMap[color.toLowerCase()] || '#E5E7EB',
              boxShadow: color.toLowerCase() === 'blanco' ? 'inset 0 0 0 1px #E5E7EB' : 'none'
            }}
            title={color}
            aria-label={`Seleccionar color ${color}`}
          />
        ))}
      </div>
      {selectedColor && (
        <p className="text-sm text-gray-600 capitalize">
          Color seleccionado: <span className="font-medium">{selectedColor}</span>
        </p>
      )}
    </div>
  );
};

interface CapacitySelectorProps {
  capacities: string[];
  selectedCapacity: string;
  onCapacityChange: (capacity: string) => void;
}

const CapacitySelector: React.FC<CapacitySelectorProps> = ({
  capacities,
  selectedCapacity,
  onCapacityChange
}) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Capacidad</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {capacities.map((capacity) => (
          <button
            key={capacity}
            onClick={() => onCapacityChange(capacity)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200",
              selectedCapacity === capacity
                ? "border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            )}
          >
            {capacity}
          </button>
        ))}
      </div>
      {selectedCapacity && (
        <p className="text-sm text-gray-600">
          Capacidad seleccionada: <span className="font-medium">{selectedCapacity}</span>
        </p>
      )}
    </div>
  );
};

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  maxQuantity?: number;
  stock: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  onIncrement,
  onDecrement,
  maxQuantity = 99,
  stock
}) => {
  const isMinQuantity = quantity <= 1;
  const isMaxQuantity = quantity >= Math.min(maxQuantity, stock);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Cantidad</h4>
      <div className="flex items-center space-x-3">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={onDecrement}
            disabled={isMinQuantity}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              const clampedValue = Math.max(1, Math.min(value, Math.min(maxQuantity, stock)));
              onQuantityChange(clampedValue);
            }}
            className="w-16 px-3 py-2 text-center border-0 focus:outline-none"
            min="1"
            max={Math.min(maxQuantity, stock)}
          />
          
          <button
            onClick={onIncrement}
            disabled={isMaxQuantity}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <span className="text-sm text-gray-600">
          {stock > 0 ? `${stock} disponibles` : 'Sin stock'}
        </span>
      </div>
    </div>
  );
};

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  product,
  open,
  onOpenChange,
  onAddToCart,
  onAddToWishlist
}) => {
  const { state, actions, selectors } = useShopDetailsReducer();

  if (!product) return null;

  // Datos por defecto para productos de pinturería
  const defaultColors = product.colors || ['blanco', 'negro', 'rojo', 'azul', 'verde'];
  const defaultCapacities = product.capacities || ['1L', '4L', '10L', '20L'];

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, {
        color: state.activeColor,
        capacity: state.storage, // Reutilizamos storage para capacity
        quantity: state.quantity
      });
    }
    onOpenChange(false);
  };

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  const totalPrice = selectors.getTotalPrice(product.price);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <QuickViewModal open={open} onOpenChange={onOpenChange}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Imagen del producto */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {hasDiscount && (
            <Badge variant="destructive" className="w-fit">
              {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}% OFF
            </Badge>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500 uppercase font-medium">{product.brand}</p>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blaze-orange-600">
                ${product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.originalPrice!.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          <Separator />

          {/* Selectores de variantes */}
          <div className="space-y-6">
            <ColorSelector
              colors={defaultColors}
              selectedColor={state.activeColor}
              onColorChange={actions.setActiveColor}
            />

            <CapacitySelector
              capacities={defaultCapacities}
              selectedCapacity={state.storage}
              onCapacityChange={actions.setStorage}
            />

            <QuantitySelector
              quantity={state.quantity}
              onQuantityChange={actions.setQuantity}
              onIncrement={actions.incrementQuantity}
              onDecrement={actions.decrementQuantity}
              stock={product.stock}
            />
          </div>

          <Separator />

          {/* Precio total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-blaze-orange-600">
                ${totalPrice.toLocaleString()}
              </span>
            </div>
            {state.quantity > 1 && (
              <p className="text-sm text-gray-600 mt-1">
                ${product.price.toLocaleString()} × {state.quantity} unidades
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black text-lg py-3 rounded-xl font-semibold"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
            </Button>

            <Button
              onClick={handleAddToWishlist}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Heart className="mr-2 h-4 w-4" />
              Agregar a Favoritos
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Envío gratis en compras mayores a $50.000</p>
            <p>• Garantía de calidad en todos nuestros productos</p>
            <p>• Asesoramiento técnico especializado</p>
          </div>
        </div>
      </div>
    </QuickViewModal>
  );
};

export default ShopDetailModal;