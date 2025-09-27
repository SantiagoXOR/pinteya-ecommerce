import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  ShoppingCart,
  Heart,
  Eye,
  Star,
  Truck,
  Shield,
  CreditCard,
  Package,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { Badge, DiscountBadge, ShippingBadge, StockBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchAutocomplete } from '@/components/ui/search-autocomplete'
import { Modal, ConfirmModal, AddToCartModal, useModal } from '@/components/ui/modal'
import { Checkbox, CheckboxGroup } from '@/components/ui/checkbox'
import {
  RadioGroup,
  RadioGroupItem,
  ShippingMethodRadio,
  PaymentMethodRadio,
} from '@/components/ui/radio-group'
import { SelectField, SelectItem } from '@/components/ui/select'
import { Textarea, ReviewTextarea, ProductInquiryTextarea } from '@/components/ui/textarea'
import { Form, FormSection, FormRow, FormActions } from '@/components/ui/form'
import { TrustBadgeGroup } from '@/components/ui/trust-badges'
import { BottomNavigation } from '@/components/ui/bottom-navigation'

const meta = {
  title: 'E-commerce/Real Examples',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Ejemplos Reales de E-commerce

Casos de uso completos del Design System aplicados a escenarios reales de e-commerce de pinturería.

## Casos de Uso Incluidos

### 🛍️ **Catálogo de Productos**
- Cards de productos con badges dinámicos
- Modal de vista rápida con información completa del producto
- Botones de acción (agregar al carrito, favoritos)
- Estados de stock y envío

### 🔍 **Búsqueda y Filtros**
- Buscador con autocompletado
- Filtros por categoría, precio, marca
- Resultados dinámicos

### 🛒 **Proceso de Compra**
- Formulario de checkout completo
- Selección de métodos de envío y pago
- Confirmaciones y validaciones

### 📱 **Experiencia Móvil**
- Navegación inferior fija
- Componentes optimizados para touch
- Layouts responsivos

### 💬 **Interacción del Usuario**
- Sistema de reseñas
- Consultas de productos
- Notificaciones y feedback

## Características Destacadas

- **Paleta Tahiti Gold**: Colores específicos para pinturería
- **Terminología Argentina**: Textos localizados
- **Mobile-First**: Optimizado para dispositivos móviles
- **Accesibilidad**: WCAG 2.1 AA compliant
- **Performance**: Componentes optimizados
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Catálogo de productos completo
export const ProductCatalog: Story = {
  render: () => {
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [cartModalOpen, setCartModalOpen] = useState(false)
    const [addedProduct, setAddedProduct] = useState<any>(null)

    const products = [
      {
        id: 1,
        name: 'Pintura Látex Interior Sherwin Williams',
        price: 15999,
        originalPrice: 18999,
        image: '/api/placeholder/300/300',
        category: 'Pinturas',
        brand: 'Sherwin Williams',
        stock: 15,
        rating: 4.5,
        reviews: 23,
        hasShipping: true,
        isNew: false,
        discount: 16,
      },
      {
        id: 2,
        name: 'Rodillo Antigota Premium 23cm',
        price: 3499,
        image: '/api/placeholder/300/300',
        category: 'Herramientas',
        brand: 'Pinceles Tigre',
        stock: 8,
        rating: 4.8,
        reviews: 45,
        hasShipping: true,
        isNew: true,
        discount: 0,
      },
      {
        id: 3,
        name: 'Enduido Plástico Interior 25kg',
        price: 8999,
        originalPrice: 9999,
        image: '/api/placeholder/300/300',
        category: 'Preparación',
        brand: 'Petrilac',
        stock: 0,
        rating: 4.2,
        reviews: 12,
        hasShipping: false,
        isNew: false,
        discount: 10,
      },
    ]

    interface Product {
      id: string
      name: string
      price: number
      originalPrice?: number
      image: string
      brand: string
      stock: number
      description?: string
      discount?: number
    }

    const handleAddToCart = (product: Product) => {
      setAddedProduct(product)
      setCartModalOpen(true)
    }

    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Catálogo de Productos</h1>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {products.map(product => (
              <Card key={product.id} className='overflow-hidden hover:shadow-lg transition-shadow'>
                <div className='relative'>
                  <img
                    src={product.image}
                    alt={product.name}
                    className='w-full h-48 object-cover'
                  />

                  {/* Badges */}
                  <div className='absolute top-2 left-2 flex flex-col gap-1'>
                    {product.isNew && <Badge variant='success'>Nuevo</Badge>}
                    {product.discount > 0 && <DiscountBadge percentage={product.discount} />}
                  </div>

                  {/* Quick Actions */}
                  <div className='absolute top-2 right-2 flex flex-col gap-1'>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      className='bg-white/80 hover:bg-white'
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button size='icon-sm' variant='ghost' className='bg-white/80 hover:bg-white'>
                      <Heart className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                <CardContent className='p-4'>
                  <div className='space-y-2'>
                    <p className='text-xs text-gray-500 uppercase'>{product.brand}</p>
                    <h3 className='font-medium text-gray-900 line-clamp-2'>{product.name}</h3>

                    {/* Rating */}
                    <div className='flex items-center gap-1'>
                      <div className='flex'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className='text-xs text-gray-500'>({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className='flex items-center gap-2'>
                      <span className='text-lg font-bold text-primary'>
                        ${product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className='text-sm text-gray-500 line-through'>
                          ${product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stock and Shipping */}
                    <div className='flex items-center gap-2'>
                      <StockBadge stock={product.stock} />
                      {product.hasShipping && <ShippingBadge />}
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2 pt-2'>
                      <Button
                        className='flex-1'
                        disabled={product.stock === 0}
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className='mr-2 h-4 w-4' />
                        {product.stock === 0 ? 'Sin Stock' : 'Agregar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick View Modal - Reemplazado por Modal estándar */}
        <Modal open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          {selectedProduct && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className='w-full h-80 object-cover rounded-lg'
                />
              </div>

              <div className='space-y-4'>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>{selectedProduct.brand}</p>
                  <h3 className='text-xl font-semibold'>{selectedProduct.name}</h3>
                </div>

                <div className='flex items-center gap-2'>
                  <span className='text-2xl font-bold text-primary'>
                    ${selectedProduct.price.toLocaleString()}
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className='text-lg text-gray-500 line-through'>
                      ${selectedProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className='text-gray-600'>
                  Pintura de alta calidad para interiores. Excelente cobertura y durabilidad. Fácil
                  aplicación y secado rápido.
                </p>

                <div className='flex gap-2'>
                  <Button
                    className='flex-1'
                    onClick={() => {
                      handleAddToCart(selectedProduct)
                      setSelectedProduct(null)
                    }}
                  >
                    <ShoppingCart className='mr-2 h-4 w-4' />
                    Agregar al Carrito
                  </Button>
                  <Button variant='outline' size='icon'>
                    <Heart className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Add to Cart Modal */}
        <AddToCartModal
          open={cartModalOpen}
          onOpenChange={setCartModalOpen}
          productName={addedProduct?.name || ''}
          productImage={addedProduct?.image}
          onContinueShopping={() => setCartModalOpen(false)}
          onGoToCart={() => {
            setCartModalOpen(false)
            alert('Ir al carrito')
          }}
        />
      </div>
    )
  },
}

// Búsqueda y filtros
export const SearchAndFilters: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [priceRange, setPriceRange] = useState('')
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])

    const categories = ['Pinturas', 'Herramientas', 'Preparación', 'Accesorios']
    const brands = ['Sherwin Williams', 'Petrilac', 'Sinteplast', 'Plavicon']
    const priceRanges = [
      { value: '0-5000', label: 'Hasta $5.000' },
      { value: '5000-15000', label: '$5.000 - $15.000' },
      { value: '15000-30000', label: '$15.000 - $30.000' },
      { value: '30000+', label: 'Más de $30.000' },
    ]

    const searchSuggestions = [
      'Pintura látex interior',
      'Rodillo antigota',
      'Enduido plástico',
      'Pincel angular',
      'Sellador para madera',
    ]

    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Búsqueda de Productos</h1>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Filtros */}
            <div className='lg:col-span-1'>
              <Card>
                <CardContent className='p-4'>
                  <h3 className='font-semibold mb-4 flex items-center'>
                    <Filter className='mr-2 h-4 w-4' />
                    Filtros
                  </h3>

                  <div className='space-y-6'>
                    {/* Categorías */}
                    <div>
                      <SelectField
                        label='Categoría'
                        placeholder='Todas las categorías'
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectField>
                    </div>

                    {/* Rango de precios */}
                    <div>
                      <RadioGroup label='Precio' value={priceRange} onValueChange={setPriceRange}>
                        {priceRanges.map(range => (
                          <RadioGroupItem
                            key={range.value}
                            value={range.value}
                            label={range.label}
                          />
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Marcas */}
                    <div>
                      <CheckboxGroup label='Marcas'>
                        {brands.map(brand => (
                          <Checkbox
                            key={brand}
                            label={brand}
                            checked={selectedBrands.includes(brand)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedBrands([...selectedBrands, brand])
                              } else {
                                setSelectedBrands(selectedBrands.filter(b => b !== brand))
                              }
                            }}
                          />
                        ))}
                      </CheckboxGroup>
                    </div>

                    <Button variant='outline' className='w-full'>
                      Limpiar Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resultados */}
            <div className='lg:col-span-3'>
              <div className='space-y-4'>
                {/* Buscador */}
                <SearchAutocomplete
                  placeholder='Buscar productos de pinturería...'
                  onSearch={query => setSearchQuery(query)}
                  size='lg'
                />

                {/* Resultados */}
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>Mostrando 24 de 156 productos</p>
                  <SelectField placeholder='Ordenar por...'>
                    <SelectItem value='relevance'>Relevancia</SelectItem>
                    <SelectItem value='price-low'>Precio: menor a mayor</SelectItem>
                    <SelectItem value='price-high'>Precio: mayor a menor</SelectItem>
                    <SelectItem value='newest'>Más nuevos</SelectItem>
                  </SelectField>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className='overflow-hidden'>
                      <div className='h-32 bg-gray-200'></div>
                      <CardContent className='p-3'>
                        <h4 className='font-medium text-sm'>Producto {i}</h4>
                        <p className='text-primary font-bold'>$12.999</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

// Proceso de checkout completo
export const CheckoutProcess: Story = {
  render: () => {
    const [step, setStep] = useState(1)
    const [shippingMethod, setShippingMethod] = useState('standard')
    const [paymentMethod, setPaymentMethod] = useState('mercadopago')
    const [sameAsShipping, setSameAsShipping] = useState(true)

    const shippingMethods = [
      {
        id: 'standard',
        name: 'Envío Estándar',
        description: '5-7 días hábiles',
        price: 'Gratis',
        icon: <Package className='h-4 w-4' />,
      },
      {
        id: 'express',
        name: 'Envío Express',
        description: '2-3 días hábiles',
        price: '$1.500',
        badge: 'Rápido',
        icon: <Truck className='h-4 w-4' />,
      },
    ]

    const paymentMethods = [
      {
        id: 'mercadopago',
        name: 'MercadoPago',
        description: 'Tarjetas, efectivo, transferencia',
        icon: <CreditCard className='h-4 w-4' />,
      },
      {
        id: 'transfer',
        name: 'Transferencia Bancaria',
        description: '5% de descuento',
        badge: 'Descuento',
        icon: <CreditCard className='h-4 w-4' />,
      },
    ]

    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Finalizar Compra</h1>

          {/* Progress Steps */}
          <div className='flex items-center justify-center mb-8'>
            {[1, 2, 3].map(stepNumber => (
              <div key={stepNumber} className='flex items-center'>
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}
                `}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`
                    w-16 h-1 mx-2
                    ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}
                  `}
                  />
                )}
              </div>
            ))}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Formulario */}
            <div className='lg:col-span-2'>
              <Form>
                {step === 1 && (
                  <FormSection
                    title='Información de Envío'
                    description='Datos para la entrega de tu pedido'
                  >
                    <FormRow columns={2}>
                      <Input label='Nombre' placeholder='Juan' required />
                      <Input label='Apellido' placeholder='Pérez' required />
                    </FormRow>

                    <Input label='Email' type='email' placeholder='juan@email.com' required />
                    <Input label='Teléfono' placeholder='+54 11 1234-5678' required />
                    <Input label='Dirección' placeholder='Av. Corrientes 1234' required />

                    <FormRow columns={3}>
                      <Input label='Ciudad' placeholder='Buenos Aires' required />
                      <SelectField label='Provincia' placeholder='Seleccionar...' required>
                        <SelectItem value='caba'>CABA</SelectItem>
                        <SelectItem value='bsas'>Buenos Aires</SelectItem>
                        <SelectItem value='cordoba'>Córdoba</SelectItem>
                      </SelectField>
                      <Input label='CP' placeholder='1043' required />
                    </FormRow>

                    <FormActions>
                      <Button onClick={() => setStep(2)}>Continuar</Button>
                    </FormActions>
                  </FormSection>
                )}

                {step === 2 && (
                  <FormSection title='Envío y Facturación'>
                    <ShippingMethodRadio
                      methods={shippingMethods}
                      value={shippingMethod}
                      onValueChange={setShippingMethod}
                    />

                    <div className='border-t pt-6'>
                      <h3 className='font-medium mb-4'>Información de Facturación</h3>
                      <Checkbox
                        label='Usar la misma dirección para facturación'
                        checked={sameAsShipping}
                        onCheckedChange={checked => setSameAsShipping(checked === true)}
                      />

                      {!sameAsShipping && (
                        <div className='space-y-4 mt-4'>
                          <Input
                            label='Dirección de Facturación'
                            placeholder='Dirección diferente'
                          />
                          <FormRow columns={3}>
                            <Input label='Ciudad' placeholder='Ciudad' />
                            <SelectField label='Provincia' placeholder='Provincia'>
                              <SelectItem value='caba'>CABA</SelectItem>
                              <SelectItem value='bsas'>Buenos Aires</SelectItem>
                            </SelectField>
                            <Input label='CP' placeholder='CP' />
                          </FormRow>
                        </div>
                      )}
                    </div>

                    <FormActions align='between'>
                      <Button variant='outline' onClick={() => setStep(1)}>
                        Volver
                      </Button>
                      <Button onClick={() => setStep(3)}>Continuar</Button>
                    </FormActions>
                  </FormSection>
                )}

                {step === 3 && (
                  <FormSection title='Método de Pago'>
                    <PaymentMethodRadio
                      methods={paymentMethods}
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    />

                    <Textarea
                      label='Comentarios Adicionales (Opcional)'
                      placeholder='Instrucciones especiales para la entrega...'
                      helperText='Cualquier información adicional para el repartidor'
                    />

                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Shield className='h-4 w-4 text-blue-600' />
                        <span className='font-medium text-blue-900'>Compra Segura</span>
                      </div>
                      <p className='text-sm text-blue-800'>
                        Tus datos están protegidos con encriptación SSL de 256 bits.
                      </p>
                    </div>

                    <FormActions align='between'>
                      <Button variant='outline' onClick={() => setStep(2)}>
                        Volver
                      </Button>
                      <Button size='lg' className='bg-green-600 hover:bg-green-700'>
                        Finalizar Compra
                      </Button>
                    </FormActions>
                  </FormSection>
                )}
              </Form>
            </div>

            {/* Resumen del pedido */}
            <div className='lg:col-span-1'>
              <Card className='sticky top-4'>
                <CardContent className='p-4'>
                  <h3 className='font-semibold mb-4'>Resumen del Pedido</h3>

                  <div className='space-y-3'>
                    <div className='flex justify-between text-sm'>
                      <span>Subtotal (2 productos)</span>
                      <span>$19.498</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Envío</span>
                      <span>{shippingMethod === 'express' ? '$1.500' : 'Gratis'}</span>
                    </div>
                    {paymentMethod === 'transfer' && (
                      <div className='flex justify-between text-sm text-green-600'>
                        <span>Descuento (5%)</span>
                        <span>-$975</span>
                      </div>
                    )}
                    <div className='border-t pt-2'>
                      <div className='flex justify-between font-semibold'>
                        <span>Total</span>
                        <span className='text-primary'>
                          $
                          {(
                            19498 +
                            (shippingMethod === 'express' ? 1500 : 0) -
                            (paymentMethod === 'transfer' ? 975 : 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <TrustBadgeGroup
                    badges={['secure', 'guarantee', 'shipping']}
                    layout='vertical'
                    size='sm'
                    className='mt-4'
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

// Sistema de reseñas y consultas
export const ReviewsAndInquiries: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('reviews')
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [showInquiryForm, setShowInquiryForm] = useState(false)

    const reviews = [
      {
        id: 1,
        user: 'María González',
        rating: 5,
        date: '15 de Marzo, 2024',
        comment:
          'Excelente pintura, muy fácil de aplicar y el acabado quedó perfecto. La recomiendo 100%.',
        helpful: 12,
      },
      {
        id: 2,
        user: 'Carlos Rodríguez',
        rating: 4,
        date: '8 de Marzo, 2024',
        comment:
          'Buena calidad, aunque el precio es un poco alto. El resultado final es muy bueno.',
        helpful: 8,
      },
    ]

    const inquiries = [
      {
        id: 1,
        user: 'Ana López',
        date: '20 de Marzo, 2024',
        question: '¿Esta pintura sirve para baños con mucha humedad?',
        answer: 'Sí, esta pintura tiene excelente resistencia a la humedad y es ideal para baños.',
        answered: true,
      },
      {
        id: 2,
        user: 'Pedro Martín',
        date: '18 de Marzo, 2024',
        question: '¿Cuántos metros cuadrados rinde un litro?',
        answer: null,
        answered: false,
      },
    ]

    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Reseñas y Consultas</h1>

          {/* Tabs */}
          <div className='flex border-b border-gray-200 mb-6'>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reseñas ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'inquiries'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Consultas ({inquiries.length})
            </button>
          </div>

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-lg font-semibold'>Reseñas de Clientes</h2>
                  <p className='text-sm text-gray-600'>Calificación promedio: 4.5/5</p>
                </div>
                <Button onClick={() => setShowReviewForm(true)}>Escribir Reseña</Button>
              </div>

              <div className='space-y-4'>
                {reviews.map(review => (
                  <Card key={review.id}>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <h4 className='font-medium'>{review.user}</h4>
                          <div className='flex items-center gap-2'>
                            <div className='flex'>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className='text-sm text-gray-500'>{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className='text-gray-700 mb-3'>{review.comment}</p>
                      <div className='flex items-center gap-4 text-sm text-gray-500'>
                        <button className='hover:text-primary'>👍 Útil ({review.helpful})</button>
                        <button className='hover:text-primary'>Responder</button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Review Form Modal */}
              <Modal
                open={showReviewForm}
                onOpenChange={setShowReviewForm}
                title='Escribir Reseña'
                size='lg'
              >
                <Form>
                  <FormSection>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium mb-2'>Calificación</label>
                        <div className='flex gap-1'>
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button key={rating} type='button'>
                              <Star className='h-6 w-6 text-gray-300 hover:text-yellow-400' />
                            </button>
                          ))}
                        </div>
                      </div>

                      <ReviewTextarea productName='Pintura Látex Interior Sherwin Williams' />

                      <FormActions>
                        <Button variant='outline' onClick={() => setShowReviewForm(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => setShowReviewForm(false)}>Publicar Reseña</Button>
                      </FormActions>
                    </div>
                  </FormSection>
                </Form>
              </Modal>
            </div>
          )}

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-lg font-semibold'>Consultas sobre el Producto</h2>
                  <p className='text-sm text-gray-600'>Pregunta lo que necesites saber</p>
                </div>
                <Button onClick={() => setShowInquiryForm(true)}>Hacer Consulta</Button>
              </div>

              <div className='space-y-4'>
                {inquiries.map(inquiry => (
                  <Card key={inquiry.id}>
                    <CardContent className='p-4'>
                      <div className='space-y-3'>
                        <div>
                          <div className='flex items-center justify-between mb-1'>
                            <h4 className='font-medium'>{inquiry.user}</h4>
                            <span className='text-sm text-gray-500'>{inquiry.date}</span>
                          </div>
                          <p className='text-gray-700'>{inquiry.question}</p>
                        </div>

                        {inquiry.answered ? (
                          <div className='bg-blue-50 border-l-4 border-blue-400 p-3'>
                            <div className='flex items-center mb-1'>
                              <span className='text-sm font-medium text-blue-900'>
                                Respuesta del vendedor:
                              </span>
                            </div>
                            <p className='text-sm text-blue-800'>{inquiry.answer}</p>
                          </div>
                        ) : (
                          <div className='bg-yellow-50 border-l-4 border-yellow-400 p-3'>
                            <p className='text-sm text-yellow-800'>
                              Pendiente de respuesta. Te notificaremos cuando tengamos una
                              respuesta.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Inquiry Form Modal */}
              <Modal
                open={showInquiryForm}
                onOpenChange={setShowInquiryForm}
                title='Hacer una Consulta'
                size='lg'
              >
                <Form>
                  <FormSection>
                    <div className='space-y-4'>
                      <ProductInquiryTextarea productName='Pintura Látex Interior Sherwin Williams' />

                      <Input
                        label='Tu Email'
                        type='email'
                        placeholder='tu@email.com'
                        helperText='Te enviaremos la respuesta a este email'
                        required
                      />

                      <FormActions>
                        <Button variant='outline' onClick={() => setShowInquiryForm(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => setShowInquiryForm(false)}>Enviar Consulta</Button>
                      </FormActions>
                    </div>
                  </FormSection>
                </Form>
              </Modal>
            </div>
          )}
        </div>
      </div>
    )
  },
}

// Experiencia móvil completa
export const MobileExperience: Story = {
  render: () => {
    const [activeBottomTab, setActiveBottomTab] = useState('home')
    const [showMobileSearch, setShowMobileSearch] = useState(false)

    const bottomNavItems = [
      { id: 'home', label: 'Inicio', icon: <span>🏠</span>, href: '/' },
      { id: 'search', label: 'Buscar', icon: <span>🔍</span>, href: '/search' },
      { id: 'cart', label: 'Carrito', icon: <span>🛒</span>, badge: 2, href: '/cart' },
      { id: 'account', label: 'Cuenta', icon: <span>👤</span>, href: '/account' },
    ]

    return (
      <div className='max-w-sm mx-auto bg-white min-h-screen relative'>
        {/* Mobile Header */}
        <div className='sticky top-0 z-10 bg-white border-b border-gray-200 p-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-lg font-bold text-primary'>Pinteya</h1>
            <div className='flex items-center gap-2'>
              <Button size='icon-sm' variant='ghost' onClick={() => setShowMobileSearch(true)}>
                <Search className='h-4 w-4' />
              </Button>
              <Button size='icon-sm' variant='ghost'>
                <Heart className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className='pb-20'>
          {activeBottomTab === 'home' && (
            <div className='p-4 space-y-6'>
              {/* Hero Banner */}
              <div className='bg-gradient-to-r from-primary to-primary-hover rounded-lg p-4 text-white'>
                <h2 className='text-lg font-bold mb-1'>¡Ofertas de Marzo!</h2>
                <p className='text-sm opacity-90'>Hasta 30% OFF en pinturas</p>
                <Button size='sm' variant='secondary' className='mt-2'>
                  Ver Ofertas
                </Button>
              </div>

              {/* Quick Categories */}
              <div>
                <h3 className='font-semibold mb-3'>Categorías</h3>
                <div className='grid grid-cols-2 gap-3'>
                  {['Pinturas', 'Herramientas', 'Preparación', 'Accesorios'].map(category => (
                    <Card key={category} className='p-3 text-center'>
                      <div className='text-2xl mb-1'>🎨</div>
                      <p className='text-sm font-medium'>{category}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Featured Products */}
              <div>
                <h3 className='font-semibold mb-3'>Productos Destacados</h3>
                <div className='space-y-3'>
                  {[1, 2].map(i => (
                    <Card key={i} className='overflow-hidden'>
                      <div className='flex'>
                        <div className='w-20 h-20 bg-gray-200 flex-shrink-0'></div>
                        <div className='p-3 flex-1'>
                          <h4 className='font-medium text-sm mb-1'>Pintura Látex {i}</h4>
                          <p className='text-xs text-gray-600 mb-2'>Sherwin Williams</p>
                          <div className='flex items-center justify-between'>
                            <span className='font-bold text-primary'>$15.999</span>
                            <Button size='sm'>Agregar</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              <TrustBadgeGroup
                badges={['secure', 'shipping', 'guarantee']}
                layout='horizontal'
                size='sm'
              />
            </div>
          )}

          {activeBottomTab === 'search' && (
            <div className='p-4'>
              <div className='space-y-4'>
                <SearchAutocomplete placeholder='Buscar productos...' size='md' />

                <div>
                  <h3 className='font-semibold mb-3'>Búsquedas Populares</h3>
                  <div className='flex flex-wrap gap-2'>
                    {['Pintura blanca', 'Rodillo', 'Pincel', 'Enduido'].map(term => (
                      <Badge key={term} variant='outline' className='cursor-pointer'>
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeBottomTab === 'cart' && (
            <div className='p-4'>
              <h2 className='text-lg font-semibold mb-4'>Mi Carrito (2)</h2>
              <div className='space-y-3'>
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardContent className='p-3'>
                      <div className='flex gap-3'>
                        <div className='w-16 h-16 bg-gray-200 rounded flex-shrink-0'></div>
                        <div className='flex-1'>
                          <h4 className='font-medium text-sm'>Pintura Látex {i}</h4>
                          <p className='text-xs text-gray-600'>Sherwin Williams</p>
                          <div className='flex items-center justify-between mt-2'>
                            <span className='font-bold text-primary'>$15.999</span>
                            <div className='flex items-center gap-2'>
                              <Button size='icon-sm' variant='outline'>
                                -
                              </Button>
                              <span className='text-sm'>1</span>
                              <Button size='icon-sm' variant='outline'>
                                +
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className='mt-6 space-y-3'>
                <div className='flex justify-between font-semibold'>
                  <span>Total:</span>
                  <span className='text-primary'>$31.998</span>
                </div>
                <Button className='w-full' size='lg'>
                  Finalizar Compra
                </Button>
              </div>
            </div>
          )}

          {activeBottomTab === 'account' && (
            <div className='p-4'>
              <div className='text-center mb-6'>
                <div className='w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2'></div>
                <h2 className='font-semibold'>Juan Pérez</h2>
                <p className='text-sm text-gray-600'>juan@email.com</p>
              </div>

              <div className='space-y-2'>
                {[
                  'Mis Pedidos',
                  'Direcciones',
                  'Métodos de Pago',
                  'Favoritos',
                  'Configuración',
                  'Ayuda',
                ].map(item => (
                  <Card key={item} className='p-3 cursor-pointer hover:bg-gray-50'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium'>{item}</span>
                      <span className='text-gray-400'>›</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation
          items={bottomNavItems}
          className='fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-sm w-full'
        />

        {/* Mobile Search Modal */}
        <Modal open={showMobileSearch} onOpenChange={setShowMobileSearch} variant='fullscreen'>
          <div className='p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <SearchAutocomplete placeholder='Buscar productos...' className='flex-1' autoFocus />
              <Button variant='ghost' onClick={() => setShowMobileSearch(false)}>
                Cancelar
              </Button>
            </div>

            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold mb-2'>Sugerencias</h3>
                <div className='space-y-2'>
                  {['Pintura látex blanca', 'Rodillo antigota', 'Enduido plástico'].map(
                    suggestion => (
                      <div
                        key={suggestion}
                        className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded'
                      >
                        <Search className='h-4 w-4 text-gray-400' />
                        <span>{suggestion}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    )
  },
}
