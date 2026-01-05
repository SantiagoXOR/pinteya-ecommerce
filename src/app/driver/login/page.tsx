/**
 * Página de login específica para drivers
 * Interfaz mobile-first optimizada para conductores
 */

'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Mail, Phone, Loader2, Navigation } from '@/lib/optimized-imports'
import { toast } from 'sonner'

export default function DriverLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        redirect: false,
        callbackUrl: '/driver/dashboard',
      })

      if (result?.error) {
        toast.error('Error de autenticación', {
          description: 'Verifica tu email y que seas un driver registrado',
        })
      } else {
        toast.success('¡Bienvenido!', {
          description: 'Redirigiendo a tu dashboard...',
        })
        router.push('/driver/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Error de conexión', {
        description: 'Intenta nuevamente en unos momentos',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Drivers de prueba para desarrollo
  const testDrivers = [
    { email: 'admin@test.dev', name: 'Admin (Test)' },
    { email: 'carlos@pinteya.com', name: 'Carlos Rodríguez' },
    { email: 'maria@pinteya.com', name: 'María González' },
    { email: 'juan@pinteya.com', name: 'Juan Pérez' },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-6'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <div className='flex justify-center'>
            <div className='bg-blue-600 p-3 rounded-full'>
              <Truck className='h-8 w-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>Pinteya Driver</h1>
          <p className='text-gray-600'>Acceso para conductores</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Navigation className='h-5 w-5' />
              Iniciar Sesión
            </CardTitle>
            <CardDescription>Ingresa tu email registrado como driver</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='email' className='text-sm font-medium'>
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='tu-email@pinteya.com'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Verificando...
                  </>
                ) : (
                  'Acceder al Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Drivers - Solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <Card className='border-orange-200 bg-orange-50'>
            <CardHeader>
              <CardTitle className='text-sm text-orange-800'>Drivers de Prueba</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {testDrivers.map(driver => (
                <Button
                  key={driver.email}
                  variant='outline'
                  size='sm'
                  className='w-full justify-start text-xs'
                  onClick={() => setEmail(driver.email)}
                >
                  <Mail className='mr-2 h-3 w-3' />
                  {driver.name} - {driver.email}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className='text-center text-sm text-gray-500'>
          <p>¿Problemas para acceder?</p>
          <p>Contacta al administrador: admin@pinteya.com</p>
        </div>
      </div>
    </div>
  )
}
