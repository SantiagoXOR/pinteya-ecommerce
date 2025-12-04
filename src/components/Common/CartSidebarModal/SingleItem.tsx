'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getPreviewImage } from '@/lib/adapters/product-adapter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, AlertCircle } from '@/lib/optimized-imports'
import { normalizeVariantLabel } from '@/lib/utils/variant-normalizer'
import { useCartWithBackend } from '@/hooks/useCartWithBackend'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useAppDispatch } from '@/redux/store'
import { removeItemFromCart, updateCartItemQuantity } from '@/redux/features/cart-slice'

const SingleItem = ({ item }: { item: any }) => {
  const [quantity, setQuantity] = useState(item.quantity)
  const [imgSrc, setImgSrc] = useState<string>(() => getPreviewImage(item))
  const [isUpdating, setIsUpdating] = useState(false)
  const [productStock, setProductStock] = useState<number | null>(null)
  const stockCache = useRef<number | null>(null)
  const hasFetchedStock = useRef(false)
  const { data: session } = useSession()
  const { updateQuantity, removeItem } = useCartWithBackend()
  const dispatch = useAppDispatch()

  // Determinar si estamos usando backend o Redux
  const isBackendMode = !!session?.user && item.product_id !== undefined
  const isReduxMode = !session?.user || item.product_id === undefined

  // Función para obtener stock del producto (para modo Redux)
  const fetchProductStock = useCallback(async (productId: number) => {
    // NUEVA VALIDACIÓN: Rechazar IDs que parecen timestamps o inválidos
    if (!productId || productId > 1000000000) { // Timestamps son > 1 billón
      console.warn(`📦 ID de producto parece inválido (posible timestamp): ${productId}`)
      return null
    }
    
    // Usar cache si ya tenemos el stock
    if (stockCache.current !== null) {
      console.log(`📦 Usando stock cache para producto ${productId}:`, stockCache.current)
      return stockCache.current
    }
    
    // Evitar múltiples llamadas si ya estamos obteniendo el stock
    if (hasFetchedStock.current) {
      console.log(`📦 Ya se está obteniendo stock para producto ${productId}, esperando...`)
      return stockCache.current
    }
    
    hasFetchedStock.current = true
    
    try {
      console.log(`📦 Obteniendo stock del producto ${productId}...`)
      const response = await fetch(`/api/products/${productId}`)
      console.log(`📦 Response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`📦 Response data:`, data)
        
        if (data.success && data.data) {
          const stock = data.data.stock
          stockCache.current = stock
          setProductStock(stock)
          console.log(`📦 Stock del producto ${productId} guardado en cache:`, stock)
          return stock
        } else {
          console.warn(`📦 Error en respuesta:`, data)
        }
      } else {
        console.warn(`📦 Producto ${productId} no encontrado (HTTP ${response.status})`)
      }
    } catch (error) {
      console.error('Error obteniendo stock:', error)
      hasFetchedStock.current = false // Permitir reintento en caso de error
    }
    
    console.log(`📦 Retornando stock desde cache:`, stockCache.current)
    return stockCache.current
  }, []) // Sin dependencias para evitar recreación

  // Obtener stock del producto al montar el componente (solo para Redux)
  useEffect(() => {
    if (isReduxMode && item.id && item.id < 1000000000 && !hasFetchedStock.current) {
      fetchProductStock(item.id)
    }
  }, [isReduxMode, item.id, fetchProductStock])

  // Debug: Verificar si el usuario está autenticado
  console.log('🔍 SingleItem Debug:', {
    hasSession: !!session?.user,
    userId: session?.user?.id,
    itemId: item.id || item.product_id,
    itemStructure: Object.keys(item),
    isBackendMode,
    isReduxMode,
    productStock,
    currentQuantity: quantity
  })

  // Sincronizar cantidad local con la del item
  useEffect(() => {
    setQuantity(item.quantity)
  }, [item.quantity])

  // Actualizar imagen cuando cambia el item (corrige bug de imagen al eliminar)
  useEffect(() => {
    const newImgSrc = getPreviewImage(item)
    setImgSrc(newImgSrc)
  }, [item.id, item.product_id])

  const handleRemoveFromCart = async () => {
    console.log('🗑️ Intentando eliminar producto:', item)
    
    setIsUpdating(true)
    
    if (isBackendMode) {
      // Usar backend si el usuario está autenticado
      const productId = item.product_id
      console.log('🔍 Backend - ProductId para eliminar:', productId)
      
      const success = await removeItem(productId)
      console.log('✅ Backend - Resultado eliminación:', success)
      
      if (!success) {
        toast.error('Error al eliminar el producto del carrito')
      }
    } else {
      // Usar Redux si no hay autenticación
      console.log('🔍 Redux - Eliminando producto:', item.id)
      dispatch(removeItemFromCart(item.id))
      toast.success('Producto eliminado del carrito')
      console.log('✅ Redux - Producto eliminado')
    }
    
    setIsUpdating(false)
  }

  const handleIncreaseQuantity = async () => {
    console.log('➕ Intentando aumentar cantidad:', item)
    console.log('🔍 Debug stock validation:', {
      isBackendMode,
      isReduxMode,
      currentQuantity: quantity,
      newQuantity: quantity + 1,
      itemStock: item.stock,
      stockCache: stockCache.current,
      hasFetchedStock: hasFetchedStock.current
    })
    
    const newQuantity = quantity + 1
    
    // Validación de stock
    let stockToCheck = null
    if (isBackendMode) {
      stockToCheck = item.stock
      console.log('🔍 Backend mode - Stock from item:', stockToCheck)
    } else if (isReduxMode) {
      console.log('🔍 Redux mode - Checking stock...')
      // Usar cache si está disponible, sino obtener stock
      if (stockCache.current !== null) {
        stockToCheck = stockCache.current
        console.log('🔍 Redux mode - Using cached stock:', stockToCheck)
      } else {
        console.log('🔍 Redux mode - Fetching stock from API...')
        stockToCheck = await fetchProductStock(item.id)
        console.log('🔍 Redux mode - Fetched stock:', stockToCheck)
      }
    }
    
    console.log('🔍 Final stock to check:', stockToCheck)
    
    // Verificar stock antes de proceder
    if (stockToCheck !== null && newQuantity > stockToCheck) {
      toast.error(`Stock máximo alcanzado. Solo hay ${stockToCheck} disponibles`)
      console.log(`❌ Stock validation failed: ${newQuantity} > ${stockToCheck}`)
      return
    }
    
    console.log(`✅ Stock validation passed: ${newQuantity} <= ${stockToCheck}`)
    proceedWithIncrease(newQuantity)
  }
  
  const proceedWithIncrease = (newQuantity: number) => {
    setIsUpdating(true)
    
    if (isBackendMode) {
      // Usar backend si el usuario está autenticado
      const productId = item.product_id
      console.log('🔍 Backend - ProductId para aumentar:', productId, 'Nueva cantidad:', newQuantity)
      
      updateQuantity(productId, newQuantity).then(success => {
        console.log('✅ Backend - Resultado aumento:', success)
        if (success) {
          setQuantity(newQuantity)
        } else {
          setQuantity(item.quantity)
        }
        setIsUpdating(false)
      })
    } else {
      // Usar Redux si no hay autenticación
      console.log('🔍 Redux - Aumentando cantidad:', item.id, 'Nueva cantidad:', newQuantity)
      dispatch(updateCartItemQuantity({ id: item.id, quantity: newQuantity }))
      setQuantity(newQuantity)
      console.log('✅ Redux - Cantidad aumentada')
      setIsUpdating(false)
    }
  }

  const handleDecreaseQuantity = async () => {
    console.log('➖ Intentando disminuir cantidad:', item)
    
    if (quantity <= 1) {
      return
    }

    const newQuantity = quantity - 1
    setIsUpdating(true)
    
    if (isBackendMode) {
      // Usar backend si el usuario está autenticado
      const productId = item.product_id
      console.log('🔍 Backend - ProductId para disminuir:', productId, 'Nueva cantidad:', newQuantity)
      
      const success = await updateQuantity(productId, newQuantity)
      console.log('✅ Backend - Resultado disminución:', success)
      
      if (success) {
        setQuantity(newQuantity)
      } else {
        setQuantity(item.quantity)
      }
    } else {
      // Usar Redux si no hay autenticación
      console.log('🔍 Redux - Disminuyendo cantidad:', item.id, 'Nueva cantidad:', newQuantity)
      dispatch(updateCartItemQuantity({ id: item.id, quantity: newQuantity }))
      setQuantity(newQuantity)
      console.log('✅ Redux - Cantidad disminuida')
    }
    
    setIsUpdating(false)
  }

  return (
    <div
      className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200'
      data-testid='cart-item'
    >
      {/* Product Info */}
      <div className='flex items-start gap-4 mb-4'>
        <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
          {/* Usar <img> con fallback para evitar dominios no permitidos y 404 */}
          <img
            src={imgSrc}
            alt={item.title}
            width={64}
            height={64}
            loading='lazy'
            className='w-full h-full object-cover'
            onError={() => setImgSrc('/images/products/placeholder.svg')}
          />
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='font-semibold text-gray-900 text-sm line-clamp-2 mb-1'>{item.title}</h3>
          {/* Badges de atributos (color, medida y acabado) */}
          {(item.attributes?.color || item.attributes?.medida || item.attributes?.finish) && (
            <div className='flex flex-wrap items-center gap-2'>
              {item.attributes?.medida && (
                <Badge variant='secondary' className='text-xs px-2 py-0.5'>
                  {normalizeVariantLabel(item.attributes.medida, 'medida')}
                </Badge>
              )}
              {item.attributes?.color && (
                <Badge variant='outline' className='text-xs px-2 py-0.5'>
                  {normalizeVariantLabel(item.attributes.color, 'color')}
                </Badge>
              )}
              {item.attributes?.finish && (
                <Badge variant='secondary' className='text-xs px-2 py-0.5'>
                  {normalizeVariantLabel(item.attributes.finish, 'finish')}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRemoveFromCart}
          disabled={isUpdating}
          aria-label='Eliminar producto del carrito'
          data-testid='remove-from-cart'
          className='text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 p-1 h-8 w-8'
        >
          <Trash2 className='w-4 h-4' />
        </Button>
      </div>

      {/* Quantity Controls */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center rounded-lg border-2 border-yellow-400 bg-white shadow-sm overflow-hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 1 || isUpdating}
              aria-label='Disminuir cantidad'
              className='h-8 w-8 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200'
            >
              <Minus className='w-3 h-3' />
            </Button>

            <div className='flex items-center justify-center w-12 h-8 bg-white font-bold text-sm text-gray-900 border-x-2 border-yellow-400'>
              {quantity}
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={handleIncreaseQuantity}
              disabled={isUpdating || (isBackendMode && item.stock !== undefined && quantity >= item.stock) || (isReduxMode && stockCache.current !== null && quantity >= stockCache.current)}
              aria-label='Aumentar cantidad'
              className='h-8 w-8 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200'
            >
              <Plus className='w-3 h-3' />
            </Button>
          </div>

          {/* Subtotal */}
          <div className='text-right'>
            <p className='font-bold text-sm' style={{ color: '#ea5a17' }}>
              ${item.discountedPrice ? (item.discountedPrice * quantity).toLocaleString() : '0'}
            </p>
            {item.price && item.discountedPrice && item.discountedPrice < item.price && (
              <p className='text-xs text-green-600 font-semibold'>
                Ahorro: ${((item.price - item.discountedPrice) * quantity).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Mostrar stock disponible */}
        {item.stock !== undefined && (
          <div className='flex items-center gap-1.5 text-xs'>
            {quantity >= item.stock ? (
              <>
                <AlertCircle className='w-3 h-3 text-amber-600' />
                <span className='text-amber-600 font-medium'>Stock máximo alcanzado</span>
              </>
            ) : item.stock <= 5 ? (
              <>
                <AlertCircle className='w-3 h-3 text-orange-600' />
                <span className='text-orange-600 font-medium'>Solo quedan {item.stock}</span>
              </>
            ) : (
              <span className='text-gray-500'>Stock: {item.stock} disponibles</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SingleItem
