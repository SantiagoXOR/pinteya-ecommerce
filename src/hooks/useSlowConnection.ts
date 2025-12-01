'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar conexiones lentas
 * Detecta si el usuario tiene una conexión 2G o slow-2g
 * Útil para deferir carga de recursos no críticos
 */
export const useSlowConnection = (): boolean => {
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Verificar si existe la API de Network Information
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      // Detectar conexiones lentas
      const effectiveType = connection.effectiveType
      const saveData = connection.saveData

      // Considerar lento si:
      // - effectiveType es 'slow-2g' o '2g'
      // - saveData está habilitado (modo de ahorro de datos)
      const isSlow = effectiveType === 'slow-2g' || 
                     effectiveType === '2g' || 
                     saveData === true

      setIsSlowConnection(isSlow)

      // Escuchar cambios en la conexión
      const handleConnectionChange = () => {
        const newEffectiveType = connection.effectiveType
        const newSaveData = connection.saveData
        const newIsSlow = newEffectiveType === 'slow-2g' || 
                         newEffectiveType === '2g' || 
                         newSaveData === true
        setIsSlowConnection(newIsSlow)
      }

      connection.addEventListener('change', handleConnectionChange)

      return () => {
        connection.removeEventListener('change', handleConnectionChange)
      }
    } else {
      // Si no hay API de Network Information, asumir conexión normal
      // pero en mobile podemos ser más conservadores
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      // En mobile sin información de conexión, ser conservador
      setIsSlowConnection(isMobile)
    }
  }, [])

  return isSlowConnection
}


