'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calculator, Paintbrush, Home, Ruler, CheckCircle, Sparkles, ShoppingCart } from '@/lib/optimized-imports'
import { useFilteredProducts } from '@/hooks/useFilteredProducts'
import { getMainImage } from '@/lib/adapters/product-adapter'
import Image from 'next/image'
import { useCartUnified } from '@/hooks/useCartUnified'
import { toast } from 'react-hot-toast'

// Configuración de rendimiento por tipo de pintura (m²/L)
const PAINT_COVERAGE: Record<string, number> = {
  'latex': 10,
  'latex-exterior': 8,
  'esmalte': 12,
  'antioxido': 10,
}

export default function CalculatorPage() {
  // Estados del formulario
  const [surfaceType, setSurfaceType] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [coats, setCoats] = useState('2')
  const [paintType, setPaintType] = useState('')
  const [hasCalculated, setHasCalculated] = useState(false)

  // Obtener productos reales - priorizar pinturas con descuento
  const { data, isLoading } = useFilteredProducts({
    limit: 3,
    sortBy: 'price',
    sortOrder: 'desc',
  })

  const products = data?.data || []
  const { addProduct } = useCartUnified()

  // Cálculo dinámico
  const calculationResult = useMemo(() => {
    if (!width || !height || !paintType || !hasCalculated) {
      return null
    }

    const widthNum = parseFloat(width)
    const heightNum = parseFloat(height)
    const coatsNum = parseInt(coats)

    if (isNaN(widthNum) || isNaN(heightNum) || widthNum <= 0 || heightNum <= 0) {
      return null
    }

    // Cálculo
    const surface = widthNum * heightNum
    const coverage = PAINT_COVERAGE[paintType] || 10
    const wastePercentage = 0.1 // 10% desperdicio
    const litersNeeded = (surface * coatsNum) / coverage
    const totalLiters = litersNeeded * (1 + wastePercentage)

    return {
      totalLiters: totalLiters.toFixed(1),
      surface: surface.toFixed(1),
      coverage,
      coats: coatsNum,
      wastePercentage: (wastePercentage * 100).toFixed(0),
    }
  }, [width, height, coats, paintType, hasCalculated])

  const handleCalculate = () => {
    if (!width || !height || !paintType || !surfaceType) {
      toast.error('Por favor completa todos los campos')
      return
    }
    setHasCalculated(true)
    toast.success('¡Presupuesto calculado!')
  }

  const handleAddToCart = (product: any) => {
    const mainImage = getMainImage(product)
    
    addProduct(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        discounted_price: product.discounted_price || product.price,
        images: product.images || [],
        brand: product.brand,
      },
      { 
        quantity: 1,
        image: mainImage
      }
    )
    toast.success(`${product.name} agregado al carrito`)
  }
  return (
    <>
      <section className='pb-20 pt-10 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden min-h-screen'>
        {/* Efectos de fondo decorativos */}
        <div className='absolute inset-0 opacity-30 pointer-events-none'>
          <div className='absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl'></div>
          <div className='absolute bottom-20 right-10 w-96 h-96 bg-yellow-200 rounded-full blur-3xl'></div>
        </div>

        <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10'>
          {/* Header Mejorado */}
          <div className='text-center mb-12'>
            {/* Badge superior con gradiente */}
            <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#eb6313] to-[#bd4811] text-white px-6 py-2 rounded-full mb-6 shadow-lg'>
              <Sparkles className='w-5 h-5' />
              <span className='font-bold text-sm'>HERRAMIENTA GRATUITA</span>
            </div>

            {/* Icono con fondo decorativo */}
            <div className='flex justify-center mb-6'>
              <div className='w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-xl'>
                <Calculator className='w-10 h-10 md:w-12 md:h-12 text-[#eb6313]' />
              </div>
            </div>

            <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>
              Cotizador de <span className='text-[#eb6313]'>Pintura</span>
            </h1>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Calcula la cantidad exacta de pintura que necesitas para tu proyecto. Obtén un
              presupuesto detallado al instante.
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Formulario de Cotización */}
            <Card className='rounded-3xl shadow-2xl border-4 border-orange-100 bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-[#eb6313]'>
                  <Ruler className='w-5 h-5' />
                  Datos del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Tipo de Superficie */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Tipo de Superficie
                  </label>
                  <select 
                    value={surfaceType}
                    onChange={(e) => setSurfaceType(e.target.value)}
                    className='w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#eb6313]/20 focus:border-[#eb6313] transition-all duration-200 hover:border-gray-400'
                  >
                    <option value=''>Selecciona el tipo de superficie</option>
                    <option value='interior'>Pared Interior</option>
                    <option value='exterior'>Pared Exterior</option>
                    <option value='techo'>Techo</option>
                    <option value='madera'>Madera</option>
                    <option value='metal'>Metal</option>
                  </select>
                </div>

                {/* Dimensiones */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Ancho (metros)
                    </label>
                    <Input 
                      type='number' 
                      placeholder='ej: 4.5' 
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className='w-full border-2 rounded-xl focus:ring-[#eb6313]/20 focus:border-[#eb6313]' 
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Alto (metros)
                    </label>
                    <Input 
                      type='number' 
                      placeholder='ej: 2.8' 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className='w-full border-2 rounded-xl focus:ring-[#eb6313]/20 focus:border-[#eb6313]' 
                    />
                  </div>
                </div>

                {/* Número de Manos */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Número de Manos
                  </label>
                  <select
                    value={coats}
                    onChange={(e) => setCoats(e.target.value)}
                    className='w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#eb6313]/20 focus:border-[#eb6313] transition-all duration-200 hover:border-gray-400'
                  >
                    <option value='1'>1 Mano</option>
                    <option value='2'>2 Manos (Recomendado)</option>
                    <option value='3'>3 Manos</option>
                  </select>
                </div>

                {/* Tipo de Pintura */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Tipo de Pintura
                  </label>
                  <select 
                    value={paintType}
                    onChange={(e) => setPaintType(e.target.value)}
                    className='w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#eb6313]/20 focus:border-[#eb6313] transition-all duration-200 hover:border-gray-400'
                  >
                    <option value=''>Selecciona el tipo de pintura</option>
                    <option value='latex'>Látex Interior</option>
                    <option value='latex-exterior'>Látex Exterior</option>
                    <option value='esmalte'>Esmalte Sintético</option>
                    <option value='antioxido'>Antióxido</option>
                  </select>
                </div>

                <Button 
                  onClick={handleCalculate}
                  className='w-full bg-gradient-to-r from-[#eb6313] to-[#bd4811] hover:from-[#bd4811] hover:to-[#eb6313] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105' 
                  size='lg'
                >
                  <Calculator className='w-4 h-4 mr-2' />
                  Calcular Presupuesto
                </Button>
              </CardContent>
            </Card>

            {/* Resultado y Recomendaciones */}
            <div className='space-y-6'>
              {/* Resultado */}
              <Card className='rounded-3xl shadow-2xl border-4 border-orange-100 bg-white overflow-hidden'>
                <CardHeader className='bg-gradient-to-r from-orange-50 to-yellow-50'>
                  <CardTitle className='flex items-center gap-2 text-[#eb6313]'>
                    <Paintbrush className='w-5 h-5' />
                    Resultado del Cálculo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!calculationResult ? (
                    <div className='text-center py-12'>
                      <Calculator className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                      <p className='text-gray-500 font-medium'>
                        Completa el formulario y presiona "Calcular Presupuesto"
                      </p>
                    </div>
                  ) : (
                  <div className='text-center py-8'>
                      <div className='text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#eb6313] to-[#bd4811] bg-clip-text text-transparent mb-2'>
                        {calculationResult.totalLiters}L
                      </div>
                      <p className='text-gray-600 mb-6 font-medium'>Cantidad total de pintura necesaria</p>
                      <div className='bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 text-left border-2 border-orange-100'>
                        <h4 className='font-bold mb-3 text-[#eb6313] flex items-center gap-2'>
                          <CheckCircle className='w-5 h-5' />
                          Desglose:
                        </h4>
                        <ul className='space-y-2 text-sm text-gray-700'>
                          <li className='flex items-center gap-2'>
                            <div className='w-1.5 h-1.5 bg-[#eb6313] rounded-full'></div>
                            Superficie: {calculationResult.surface} m²
                          </li>
                          <li className='flex items-center gap-2'>
                            <div className='w-1.5 h-1.5 bg-[#eb6313] rounded-full'></div>
                            Rendimiento: {calculationResult.coverage} m²/L
                          </li>
                          <li className='flex items-center gap-2'>
                            <div className='w-1.5 h-1.5 bg-[#eb6313] rounded-full'></div>
                            {calculationResult.coats} manos de pintura
                          </li>
                          <li className='flex items-center gap-2'>
                            <div className='w-1.5 h-1.5 bg-[#eb6313] rounded-full'></div>
                            + {calculationResult.wastePercentage}% desperdicio
                          </li>
                      </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Productos Recomendados */}
              <Card className='rounded-3xl shadow-2xl border-4 border-orange-100 bg-white overflow-hidden'>
                <CardHeader className='bg-gradient-to-r from-orange-50 to-yellow-50'>
                  <CardTitle className='text-[#eb6313]'>Productos Recomendados</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='animate-spin w-8 h-8 border-2 border-[#eb6313] border-t-transparent rounded-full'></div>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {products.slice(0, 3).map((product) => {
                        const currentPrice = product.discounted_price || product.price
                        const hasDiscount = product.discounted_price && product.discounted_price < product.price
                        const productImage = getMainImage(product)

                        return (
                          <div
                            key={product.id}
                            className='flex items-center gap-3 p-4 border-2 border-orange-100 rounded-2xl hover:shadow-lg transition-all duration-200 hover:border-orange-200'
                          >
                            <div className='w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0'>
                              <Image
                                src={productImage}
                                alt={product.name}
                                width={64}
                                height={64}
                                className='w-full h-full object-cover'
                              />
                      </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-bold text-gray-900 line-clamp-1'>{product.name}</h4>
                              <p className='text-xs text-gray-500'>{product.brand || 'Sin marca'}</p>
                              <div className='flex items-center gap-2'>
                                <p className='text-[#eb6313] font-bold text-lg'>
                                  ${currentPrice.toLocaleString()}
                                </p>
                                {hasDiscount && (
                                  <span className='text-xs text-gray-400 line-through'>
                                    ${product.price.toLocaleString()}
                                  </span>
                                )}
                    </div>
                  </div>
                            <Button
                              size='sm'
                              onClick={() => handleAddToCart(product)}
                              className='bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-md flex-shrink-0'
                            >
                              <ShoppingCart className='w-4 h-4' />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {products.length > 0 && (
                    <div className='mt-6 pt-6 border-t-2 border-orange-100'>
                      <div className='flex justify-between items-center mb-4'>
                        <span className='font-bold text-gray-900'>Total estimado:</span>
                        <span className='text-2xl font-bold text-[#eb6313]'>
                          ${products.slice(0, 3).reduce((sum, p) => sum + (p.discounted_price || p.price), 0).toLocaleString()}
                        </span>
                      </div>
                      <Button 
                        onClick={() => {
                          products.slice(0, 3).forEach(product => handleAddToCart(product))
                          toast.success('Productos agregados al carrito')
                        }}
                        className='w-full bg-gradient-to-r from-[#eb6313] to-[#bd4811] hover:from-[#bd4811] hover:to-[#eb6313] text-white shadow-lg hover:shadow-xl transition-all duration-300' 
                        variant='default'
                      >
                        Agregar Todo al Carrito
                    </Button>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tips y Consejos */}
          <div className='mt-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center'>
              Tips para tu <span className='text-[#eb6313]'>Proyecto</span>
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <Card className='rounded-3xl shadow-lg border-2 border-orange-100 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-orange-50'>
                <CardContent className='p-6 text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                    <Home className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='font-bold text-lg mb-3 text-gray-900'>Preparación</h3>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Limpia y lija la superficie antes de pintar para mejores resultados.
                  </p>
                </CardContent>
              </Card>

              <Card className='rounded-3xl shadow-lg border-2 border-orange-100 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-orange-50'>
                <CardContent className='p-6 text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-[#eb6313] to-[#bd4811] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                    <Paintbrush className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='font-bold text-lg mb-3 text-gray-900'>Aplicación</h3>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Aplica capas delgadas y uniformes para un acabado profesional.
                  </p>
                </CardContent>
              </Card>

              <Card className='rounded-3xl shadow-lg border-2 border-orange-100 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-orange-50'>
                <CardContent className='p-6 text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                    <Calculator className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='font-bold text-lg mb-3 text-gray-900'>Cantidad</h3>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Siempre compra un 10% extra para retoques y desperdicio.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
