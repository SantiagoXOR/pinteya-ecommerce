import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface AccessDeniedPageProps {
  searchParams: {
    type?: string
  }
}

export default function AccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const accessType = searchParams.type || 'general'
  
  const getAccessInfo = () => {
    switch (accessType) {
      case 'admin':
        return {
          title: 'Acceso Administrativo Denegado',
          description: 'No tienes permisos para acceder al panel administrativo.',
          details: 'Solo los administradores autorizados pueden acceder a esta sección.',
          icon: Shield,
          color: 'text-red-500',
        }
      case 'driver':
        return {
          title: 'Acceso de Conductor Denegado',
          description: 'No tienes permisos para acceder al panel de conductores.',
          details: 'Solo los conductores autorizados pueden acceder a esta sección.',
          icon: Shield,
          color: 'text-orange-500',
        }
      default:
        return {
          title: 'Acceso Denegado',
          description: 'No tienes permisos para acceder a esta sección.',
          details: 'Contacta al administrador si crees que esto es un error.',
          icon: Shield,
          color: 'text-gray-500',
        }
    }
  }

  const accessInfo = getAccessInfo()
  const IconComponent = accessInfo.icon

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className={`w-16 h-16 ${accessInfo.color} mx-auto mb-4`}>
            <IconComponent className='w-full h-full' />
          </div>
          <CardTitle className='text-2xl'>{accessInfo.title}</CardTitle>
          <CardDescription>{accessInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center text-sm text-gray-600'>
            {accessInfo.details}
          </div>
          
          <div className='flex flex-col space-y-2'>
            <Link href='/' className='w-full'>
              <Button className='w-full' variant='default'>
                <Home className='w-4 h-4 mr-2' />
                Ir al Inicio
              </Button>
            </Link>
            
            <Link href='javascript:history.back()' className='w-full'>
              <Button className='w-full' variant='outline'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Volver Atrás
              </Button>
            </Link>
          </div>

          <div className='text-center text-xs text-gray-500 pt-4 border-t'>
            Si crees que esto es un error, contacta al administrador del sistema.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}