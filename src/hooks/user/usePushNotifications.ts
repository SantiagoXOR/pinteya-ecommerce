// =====================================================
// HOOK: NOTIFICACIONES PUSH PARA CLIENTES
// Descripción: Hook para suscribirse y manejar notificaciones push
// =====================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// =====================================================
// INTERFACES
// =====================================================

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function usePushNotifications() {
  const { data: session } = useSession()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar soporte de notificaciones push
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [])

  // Verificar si ya está suscrito
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !session) return

    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      setIsSubscribed(!!sub)
      if (sub) {
        setSubscription({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64(sub.getKey('auth')!),
          },
        })
      }
    } catch (error) {
      console.error('Error verificando suscripción:', error)
    }
  }, [isSupported, session])

  // Solicitar permiso y suscribirse
  const subscribe = useCallback(async () => {
    if (!isSupported || !session) {
      setError('Notificaciones push no soportadas o usuario no autenticado')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Solicitar permiso
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Permiso de notificaciones denegado')
        setIsLoading(false)
        return false
      }

      // Registrar service worker si no está registrado
      let registration = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
      }

      // Obtener VAPID public key del servidor
      const vapidPublicKeyResponse = await fetch('/api/user/push/vapid-key')
      if (!vapidPublicKeyResponse.ok) {
        throw new Error('Error obteniendo VAPID key')
      }
      const { publicKey } = await vapidPublicKeyResponse.json()

      if (!publicKey) {
        throw new Error('VAPID public key no disponible')
      }

      // Convertir VAPID key a formato Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey)

      // Suscribirse
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      const pushSubscription: PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
          auth: arrayBufferToBase64(sub.getKey('auth')!),
        },
      }

      // Guardar suscripción en el servidor
      const response = await fetch('/api/user/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushSubscription),
      })

      if (!response.ok) {
        throw new Error('Error guardando suscripción')
      }

      setSubscription(pushSubscription)
      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Error suscribiéndose a notificaciones push:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      setIsLoading(false)
      return false
    }
  }, [isSupported, session])

  // Desuscribirse
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()

      if (sub) {
        await sub.unsubscribe()
      }

      // Eliminar suscripción del servidor
      await fetch(`/api/user/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: 'DELETE',
      })

      setSubscription(null)
      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Error desuscribiéndose:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      setIsLoading(false)
      return false
    }
  }, [subscription])

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
