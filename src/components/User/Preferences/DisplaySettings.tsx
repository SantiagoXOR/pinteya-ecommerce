'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Monitor, Globe, DollarSign, Palette } from '@/lib/optimized-imports'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

export function DisplaySettings() {
  const { preferences, isLoading, updateSection } = useUserPreferences()

  const { theme, setTheme } = useTheme()

  const displayPrefs = preferences?.display || {
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    theme: 'system',
  }

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateSection('display', {
        ...displayPrefs,
        [key]: value,
      })

      // Aplicar tema inmediatamente
      if (key === 'theme') {
        setTheme(value)
      }

      toast.success('Preferencia actualizada correctamente')
    } catch (error) {
      toast.error('Error al actualizar preferencia')
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-1/2'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Configuración de Display</h3>
        <p className='text-sm text-gray-600'>
          Personaliza la apariencia y el formato de la información mostrada.
        </p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Palette className='h-5 w-5 mr-2' />
            Tema y Apariencia
          </CardTitle>
          <CardDescription>Configura el tema visual de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='theme'>Tema</Label>
            <Select
              value={displayPrefs.theme}
              onValueChange={value => handleUpdate('theme', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona un tema' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='light'>Claro</SelectItem>
                <SelectItem value='dark'>Oscuro</SelectItem>
                <SelectItem value='system'>Sistema (automático)</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-sm text-gray-600'>
              El tema del sistema se ajusta automáticamente según tu configuración del dispositivo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Globe className='h-5 w-5 mr-2' />
            Idioma y Región
          </CardTitle>
          <CardDescription>Configura el idioma y la zona horaria de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='language'>Idioma</Label>
            <Select
              value={displayPrefs.language}
              onValueChange={value => handleUpdate('language', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona un idioma' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='es'>Español</SelectItem>
                <SelectItem value='en'>English</SelectItem>
                <SelectItem value='pt'>Português</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='timezone'>Zona horaria</Label>
            <Select
              value={displayPrefs.timezone}
              onValueChange={value => handleUpdate('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona una zona horaria' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='America/Argentina/Buenos_Aires'>Buenos Aires (GMT-3)</SelectItem>
                <SelectItem value='America/Sao_Paulo'>São Paulo (GMT-3)</SelectItem>
                <SelectItem value='America/Santiago'>Santiago (GMT-3)</SelectItem>
                <SelectItem value='America/Lima'>Lima (GMT-5)</SelectItem>
                <SelectItem value='America/Bogota'>Bogotá (GMT-5)</SelectItem>
                <SelectItem value='America/Mexico_City'>Ciudad de México (GMT-6)</SelectItem>
                <SelectItem value='UTC'>UTC (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <DollarSign className='h-5 w-5 mr-2' />
            Moneda y Formato
          </CardTitle>
          <CardDescription>
            Configura la moneda predeterminada para mostrar precios.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='currency'>Moneda</Label>
            <Select
              value={displayPrefs.currency}
              onValueChange={value => handleUpdate('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona una moneda' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ARS'>Peso Argentino (ARS)</SelectItem>
                <SelectItem value='USD'>Dólar Estadounidense (USD)</SelectItem>
                <SelectItem value='EUR'>Euro (EUR)</SelectItem>
                <SelectItem value='BRL'>Real Brasileño (BRL)</SelectItem>
                <SelectItem value='CLP'>Peso Chileno (CLP)</SelectItem>
                <SelectItem value='COP'>Peso Colombiano (COP)</SelectItem>
                <SelectItem value='MXN'>Peso Mexicano (MXN)</SelectItem>
                <SelectItem value='PEN'>Sol Peruano (PEN)</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-sm text-gray-600'>
              Esta configuración solo afecta la visualización. Los precios reales pueden variar
              según el país.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Display Preview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Monitor className='h-5 w-5 mr-2' />
            Vista Previa
          </CardTitle>
          <CardDescription>Así se verá la información con tu configuración actual.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <div className='space-y-2'>
              <p className='text-sm text-gray-600'>Fecha y hora:</p>
              <p className='font-medium'>
                {new Date().toLocaleString(displayPrefs.language === 'es' ? 'es-AR' : 'en-US', {
                  timeZone: displayPrefs.timezone,
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <div className='space-y-2 mt-4'>
              <p className='text-sm text-gray-600'>Precio de ejemplo:</p>
              <p className='font-medium'>
                {new Intl.NumberFormat(displayPrefs.language === 'es' ? 'es-AR' : 'en-US', {
                  style: 'currency',
                  currency: displayPrefs.currency,
                }).format(1299.99)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex justify-end space-x-3'>
        <Button variant='outline' onClick={() => window.location.reload()}>
          Cancelar
        </Button>
        <Button onClick={() => toast.success('Configuración guardada')}>Guardar cambios</Button>
      </div>
    </div>
  )
}
