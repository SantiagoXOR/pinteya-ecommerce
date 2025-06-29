/**
 * 🎨 Pinteya Design System - Colors Documentation
 * 
 * Documentación interactiva de la paleta de colores
 */

import type { Meta, StoryObj } from '@storybook/react';
import { colors, colorAliases } from '../../tokens/colors';

const meta: Meta = {
  title: 'Design Tokens/Colors',
  parameters: {
    docs: {
      description: {
        component: `
# Color Tokens

Paleta de colores del Pinteya Design System, optimizada para e-commerce de pinturería.

## Principios de Color

### 🔥 Blaze Orange (#EF7D00)
Color primario que transmite energía, confianza y acción. Usado para:
- CTAs principales
- Precios y ofertas
- Elementos de alta prioridad

### 🌿 Fun Green (#00A651)
Color secundario que representa naturaleza, éxito y disponibilidad. Usado para:
- Estados de éxito
- Indicadores de stock
- Envío gratis

### ☀️ Bright Sun (#FFD700)
Color de acento para destacar elementos especiales. Usado para:
- Badges promocionales
- Elementos destacados
- Ofertas especiales

### 🤎 Warm Neutrals
Colores neutros cálidos que complementan la paleta principal:
- Fondos suaves (#FFF7EB)
- Textos principales (#712F00)
- Elementos de soporte
        `,
      },
    },
  },
};

export default meta;

// 🎨 Componente para mostrar colores
const ColorSwatch = ({ 
  name, 
  value, 
  description 
}: { 
  name: string; 
  value: string; 
  description?: string; 
}) => (
  <div className="flex items-center gap-3 p-3 border rounded-lg">
    <div 
      className="w-12 h-12 rounded-lg border shadow-sm"
      style={{ backgroundColor: value }}
    />
    <div className="flex-1">
      <div className="font-semibold text-sm">{name}</div>
      <div className="font-mono text-xs text-gray-600">{value}</div>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
    </div>
  </div>
);

// 🎨 Paleta de colores por escala
const ColorScale = ({ 
  name, 
  scale, 
  description 
}: { 
  name: string; 
  scale: Record<string, string>; 
  description?: string; 
}) => (
  <div className="space-y-3">
    <div>
      <h3 className="font-semibold text-lg">{name}</h3>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {Object.entries(scale).map(([key, value]) => (
        <ColorSwatch 
          key={key}
          name={`${name.toLowerCase()}.${key}`}
          value={value}
        />
      ))}
    </div>
  </div>
);

// 📖 Historias

export const PrimaryColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <ColorScale 
        name="Primary (Blaze Orange)"
        scale={colors.primary}
        description="Color principal para CTAs, precios y elementos de alta prioridad"
      />
    </div>
  ),
};

export const SecondaryColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <ColorScale 
        name="Secondary (Fun Green)"
        scale={colors.secondary}
        description="Color secundario para éxito, disponibilidad y acciones positivas"
      />
    </div>
  ),
};

export const AccentColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <ColorScale 
        name="Accent (Bright Sun)"
        scale={colors.accent}
        description="Color de acento para badges, promociones y elementos destacados"
      />
    </div>
  ),
};

export const NeutralColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <ColorScale 
        name="Neutral (Warm Beige to Deep Brown)"
        scale={colors.neutral}
        description="Colores neutros cálidos para fondos, textos y elementos de soporte"
      />
    </div>
  ),
};

export const GrayColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <ColorScale 
        name="Gray (Functional Grays)"
        scale={colors.gray}
        description="Grises funcionales para interfaces, bordes y elementos neutros"
      />
    </div>
  ),
};

export const StatusColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <ColorScale 
        name="Success"
        scale={colors.success}
        description="Estados de éxito y confirmación"
      />
      <ColorScale 
        name="Warning"
        scale={colors.warning}
        description="Advertencias y estados de atención"
      />
      <ColorScale 
        name="Error"
        scale={colors.error}
        description="Errores y estados destructivos"
      />
      <ColorScale 
        name="Info"
        scale={colors.info}
        description="Información y estados informativos"
      />
    </div>
  ),
};

export const EcommerceColors: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">E-commerce Specific Colors</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ColorSwatch
          name="Price Current"
          value={colors.ecommerce.price.current}
          description="Color principal para precios actuales"
        />
        <ColorSwatch
          name="Original Price"
          value={colors.ecommerce.price.original}
          description="Precios originales tachados"
        />
        <ColorSwatch
          name="Discount"
          value={colors.ecommerce.price.discount}
          description="Indicadores de descuento"
        />
        <ColorSwatch
          name="In Stock"
          value={colors.ecommerce.stock.available}
          description="Productos disponibles"
        />
        <ColorSwatch
          name="Out of Stock"
          value={colors.ecommerce.stock.outOfStock}
          description="Productos agotados"
        />
        <ColorSwatch
          name="Free Shipping"
          value={colors.ecommerce.shipping.free}
          description="Envío gratis"
        />
        <ColorSwatch
          name="Add to Cart"
          value={colors.ecommerce.purchase.addToCart}
          description="Botón agregar al carrito"
        />
        <ColorSwatch
          name="Buy Now"
          value={colors.ecommerce.purchase.buyNow}
          description="Botón comprar ahora"
        />
      </div>
    </div>
  ),
};

export const ColorAliases: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Color Aliases</h3>
      <p className="text-sm text-gray-600">
        Aliases comunes para facilitar el uso de colores en el desarrollo.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(colorAliases).map(([name, value]) => (
          <ColorSwatch 
            key={name}
            name={name}
            value={value}
          />
        ))}
      </div>
    </div>
  ),
};

export const AllColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Pinteya Design System Colors</h2>
        <p className="text-gray-600 mb-8">
          Paleta completa de colores optimizada para e-commerce de pinturería.
        </p>
      </div>
      
      <ColorScale 
        name="Primary"
        scale={colors.primary}
        description="Blaze Orange - Color principal"
      />
      
      <ColorScale 
        name="Secondary"
        scale={colors.secondary}
        description="Fun Green - Color secundario"
      />
      
      <ColorScale 
        name="Accent"
        scale={colors.accent}
        description="Bright Sun - Color de acento"
      />
      
      <ColorScale 
        name="Neutral"
        scale={colors.neutral}
        description="Warm neutrals - Beige a marrón"
      />
    </div>
  ),
};
