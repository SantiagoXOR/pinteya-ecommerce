'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ShoppingBag, DollarSign, Monitor, Clock, User, Settings, Package } from '@/lib/optimized-imports'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

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

interface DashboardStats {
  total_orders: number
  total_spent: number
  pending_orders: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/user/dashboard')
        if (!res.ok) {
          if (res.status === 401) {
            setError('Debes iniciar sesión')
            return
          }
          setError('No se pudieron cargar las estadísticas')
          return
        }
        const json = await res.json()
        if (!cancelled && json?.success && json?.dashboard?.statistics) {
          setStats(json.dashboard.statistics)
        }
      } catch {
        if (!cancelled) setError('Error al cargar el dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const totalOrders = stats?.total_orders ?? 0
  const totalSpent = stats?.total_spent ?? 0
  const pendingOrders = stats?.pending_orders ?? 0

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
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse'
              >
                <div className='h-4 bg-gray-200 rounded w-24 mb-3' />
                <div className='h-8 bg-gray-200 rounded w-16' />
              </div>
            ))}
          </>
        ) : error ? (
          <div className='col-span-full bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800'>
            {error}
          </div>
        ) : (
          <>
            <StatCard
              title='Total de Órdenes'
              value={totalOrders}
              icon={ShoppingBag}
              color='bg-blue-500'
              href='/mis-ordenes'
            />
            <StatCard
              title='Total Gastado'
              value={formatCurrency(totalSpent)}
              icon={DollarSign}
              color='bg-green-500'
            />
            <StatCard
              title='Órdenes Pendientes'
              value={pendingOrders}
              icon={Clock}
              color='bg-yellow-500'
              href='/mis-ordenes'
            />
            <StatCard
              title='Sesión actual'
              value={1}
              icon={Monitor}
              color='bg-purple-500'
            />
          </>
        )}
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

          <div
            className='flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-90 cursor-not-allowed'
            aria-disabled
          >
            <Settings className='h-8 w-8 text-gray-400 mr-3' />
            <div>
              <h3 className='font-medium text-gray-500'>Configurar Seguridad</h3>
              <p className='text-sm text-gray-500'>Próximamente</p>
            </div>
          </div>

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
