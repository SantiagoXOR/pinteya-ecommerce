'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ShoppingBag, DollarSign, Monitor, Clock, User, Settings, Package } from '@/lib/optimized-imports'
import Link from 'next/link'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  href?: string
}

function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const content = (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className='h-6 w-6 text-white' />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className='space-y-6'>
      {/* Welcome Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>
          ¡Bienvenido, {user?.name || 'Usuario'}!
        </h1>
        <p className='text-gray-600'>
          Aquí puedes gestionar tu perfil, ver tus órdenes y configurar tu cuenta.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total de Órdenes'
          value={0}
          icon={ShoppingBag}
          color='bg-blue-500'
          href='/mis-ordenes'
        />
        <StatCard title='Total Gastado' value='$0' icon={DollarSign} color='bg-green-500' />
        <StatCard
          title='Órdenes Pendientes'
          value={0}
          icon={Clock}
          color='bg-yellow-500'
          href='/mis-ordenes'
        />
        <StatCard
          title='Sesiones Activas'
          value='1'
          icon={Monitor}
          color='bg-purple-500'
          href='/dashboard/sessions'
        />
      </div>

      {/* Quick Actions */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Acciones Rápidas</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Link
            href='/dashboard/profile'
            className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <User className='h-8 w-8 text-blue-500 mr-3' />
            <div>
              <h3 className='font-medium text-gray-900'>Editar Perfil</h3>
              <p className='text-sm text-gray-600'>Actualiza tu información personal</p>
            </div>
          </Link>

          <Link
            href='/dashboard/security'
            className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <Settings className='h-8 w-8 text-green-500 mr-3' />
            <div>
              <h3 className='font-medium text-gray-900'>Configurar Seguridad</h3>
              <p className='text-sm text-gray-600'>Gestiona tu seguridad</p>
            </div>
          </Link>

          <Link
            href='/mis-ordenes'
            className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <Package className='h-8 w-8 text-purple-500 mr-3' />
            <div>
              <h3 className='font-medium text-gray-900'>Ver Órdenes</h3>
              <p className='text-sm text-gray-600'>Revisa tus compras</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
