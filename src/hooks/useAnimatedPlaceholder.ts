import { useState, useEffect, useRef } from 'react'

// Lista de productos populares para la animación
const PRODUCT_NAMES = [
  'Recuplast Frentes',
  'Látex Interior',
  'Esmalte Sintético',
  'Rodillos Premium',
  'Pinceles Profesionales',
  'Antihumedad',
  'Pintura Exterior',
  'Barniz para Maderas',
]

interface UseAnimatedPlaceholderOptions {
  basePlaceholder?: string
  productNames?: string[]
  interval?: number
  enabled?: boolean
}

export function useAnimatedPlaceholder({
  basePlaceholder = 'Buscar productos...',
  productNames = PRODUCT_NAMES,
  interval = 3000,
  enabled = true,
}: UseAnimatedPlaceholderOptions = {}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(basePlaceholder)
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) {
      setCurrentPlaceholder(basePlaceholder)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Mostrar el placeholder base primero
    setCurrentPlaceholder(basePlaceholder)

    // Limpiar intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Luego comenzar con la animación de productos después de un delay
    const animationTimer = setTimeout(() => {
      // Cambiar al primer producto
      setCurrentPlaceholder(productNames[0])
      setCurrentIndex(0)

      // Configurar intervalo para cambiar productos
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % productNames.length
          setCurrentPlaceholder(productNames[nextIndex])
          return nextIndex
        })
      }, interval)
    }, 2000) // Esperar 2 segundos antes de empezar la animación

    return () => {
      clearTimeout(animationTimer)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [basePlaceholder, productNames, interval, enabled])

  // Reiniciar animación cuando el usuario empieza a escribir
  const resetAnimation = () => {
    setCurrentPlaceholder(basePlaceholder)
    setCurrentIndex(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return {
    placeholder: currentPlaceholder,
    resetAnimation,
  }
}

