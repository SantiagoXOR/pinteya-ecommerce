/**
 * Página de Analytics Dashboard para administradores
 * Vista completa de métricas, conversiones y análisis de comportamiento
 */

'use client'

import React, { useState, useEffect } from 'react'
// ⚡ PERFORMANCE: Lazy load de Framer Motion para reducir bundle inicial
import { motion } from '@/lib/framer-motion-lazy'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard'
import ConversionFunnel from '@/components/Analytics/ConversionFunnel'
import HeatmapViewer from '@/components/Analytics/HeatmapViewer'
import GoogleAnalyticsEmbed from '@/components/Analytics/GoogleAnalyticsEmbed'
import MetaMetrics from '@/components/Analytics/MetaMetrics'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useUserRole } from '@/hooks/useUserRole'
import { UserInteraction } from '@/lib/integrations/analytics'
import { BarChart3, TrendingUp, Users, Eye, Download, RefreshCw, Settings } from '@/lib/optimized-imports'

const AnalyticsPage: React.FC = () => {
  const router = useRouter()
  const { user, isLoaded } = useAuth()
  const { userProfile, isAdmin, hasPermission, isLoading: roleLoading } = useUserRole()
  const { getEvents, getInteractions, getConversionMetrics } = useAnalytics()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'funnel' | 'heatmap' | 'google' | 'meta'>('dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [conversionData, setConversionData] = useState({
    productViews: 0,
    cartAdditions: 0,
    checkoutStarts: 0,
    checkoutCompletions: 0,
  })
  const [conversionAnalysis, setConversionAnalysis] = useState<{
    improvements: Array<{ label: string; value: string; severity: string }>
    strengths: Array<{ label: string; value: string; severity: string }>
  } | null>(null)
  const [pageInteractions, setPageInteractions] = useState<Array<{ page: string; interactions: number }>>([])
  const [interactions, setInteractions] = useState<UserInteraction[]>([])
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingInteractions, setLoadingInteractions] = useState(false)
  
  // ✅ BYPASS: Verificar inmediatamente si NEXT_PUBLIC_BYPASS_AUTH está activo (disponible en cliente)
  const bypassAuthEnv = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const [bypassAuth, setBypassAuth] = useState<boolean | null>(bypassAuthEnv ? true : null)

  // Verificar si el bypass está activo desde el servidor (como respaldo, solo si no tenemos NEXT_PUBLIC_BYPASS_AUTH)
  useEffect(() => {
    // Si ya tenemos NEXT_PUBLIC_BYPASS_AUTH activo, no necesitamos verificar el servidor
    if (bypassAuthEnv) {
      setBypassAuth(true)
      return
    }
    const checkBypass = async () => {
      try {
        const response = await fetch('/api/dev/check-bypass')
        if (response.ok) {
          const data = await response.json()
          setBypassAuth(data.bypassEnabled)
        } else {
          setBypassAuth(false)
        }
      } catch (error) {
        console.error('[Analytics Page] Error verificando bypass:', error)
        setBypassAuth(false)
      }
    }
    checkBypass()
  }, [])

  // Verificar permisos de administrador - Usar rol de la sesión de NextAuth
  useEffect(() => {
    // ✅ BYPASS: Si BYPASS_AUTH está activo, permitir acceso sin verificar sesión
    const isBypassActive = bypassAuth === true || bypassAuthEnv
    if (isBypassActive) {
      console.log('[Analytics Page] ✅ BYPASS_AUTH activo, permitiendo acceso sin autenticación')
      return
    }

    // Si el bypass aún no se ha verificado y no tenemos NEXT_PUBLIC_BYPASS_AUTH, esperar
    if (bypassAuth === null && !bypassAuthEnv) {
      return
    }

    // Esperar a que todo esté cargado
    if (!isLoaded) {
      return
    }

    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Verificar si el usuario es admin usando el rol de la sesión directamente
    const userRole = (user as any)?.role
    
    // Solo redirigir si definitivamente no es admin
    // El middleware ya debería haber bloqueado el acceso si no es admin
    if (userRole && userRole !== 'admin') {
      console.log('[Analytics Page] Usuario sin permisos, redirigiendo. Rol:', userRole)
      router.push('/')
      return
    }

    console.log('[Analytics Page] Acceso permitido. Rol:', userRole || 'cargando...')
  }, [user, isLoaded, router, bypassAuth, bypassAuthEnv])

  useEffect(() => {
    loadConversionData()
    loadConversionAnalysis()
    loadPageInteractions()
  }, [])

  useEffect(() => {
    if (activeTab === 'heatmap') {
      loadInteractions()
    }
  }, [activeTab])

  const loadConversionData = async () => {
    try {
      // Obtener datos desde la API (base de datos)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(
        `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}`
      )
      if (!response.ok) {
        throw new Error('Error al cargar métricas de conversión')
      }
      const data = await response.json()

      setConversionData({
        productViews: data.ecommerce?.productViews || 0,
        cartAdditions: data.ecommerce?.cartAdditions || 0,
        checkoutStarts: data.ecommerce?.checkoutStarts || 0,
        checkoutCompletions: data.ecommerce?.checkoutCompletions || 0,
      })
    } catch (error) {
      console.error('Error cargando datos de conversión:', error)
      // Si falla, mostrar ceros en lugar de datos en memoria
      setConversionData({
        productViews: 0,
        cartAdditions: 0,
        checkoutStarts: 0,
        checkoutCompletions: 0,
      })
    }
  }

  const loadConversionAnalysis = async () => {
    try {
      setLoadingAnalysis(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(
        `/api/analytics/conversion-analysis?startDate=${startDate}&endDate=${endDate}`
      )
      if (!response.ok) {
        throw new Error('Error al cargar análisis de conversión')
      }
      const data = await response.json()
      setConversionAnalysis(data)
    } catch (error) {
      console.error('Error cargando análisis de conversión:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const loadPageInteractions = async () => {
    try {
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(
        `/api/analytics/interactions?startDate=${startDate}&endDate=${endDate}&statsOnly=true`
      )
      if (!response.ok) {
        throw new Error('Error al cargar interacciones por página')
      }
      const data = await response.json()
      setPageInteractions(data.stats || [])
    } catch (error) {
      console.error('Error cargando interacciones por página:', error)
    }
  }

  const loadInteractions = async () => {
    try {
      setLoadingInteractions(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/'

      const response = await fetch(
        `/api/analytics/interactions?startDate=${startDate}&endDate=${endDate}&page=${currentPage}`
      )
      if (!response.ok) {
        throw new Error('Error al cargar interacciones')
      }
      const data = await response.json()
      setInteractions(data.interactions || [])
    } catch (error) {
      console.error('Error cargando interacciones:', error)
    } finally {
      setLoadingInteractions(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        loadConversionData(),
        loadConversionAnalysis(),
        loadPageInteractions(),
        activeTab === 'heatmap' ? loadInteractions() : Promise.resolve(),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  const exportData = async () => {
    try {
      // Obtener todos los datos desde la base de datos
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [metricsResponse, interactionsResponse, conversionResponse] = await Promise.all([
        fetch(`/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/analytics/interactions?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/analytics/conversion-analysis?startDate=${startDate}&endDate=${endDate}`),
      ])

      const metrics = metricsResponse.ok ? await metricsResponse.json() : null
      const interactions = interactionsResponse.ok ? await interactionsResponse.json() : null
      const conversion = conversionResponse.ok ? await conversionResponse.json() : null

      const exportData = {
        metrics,
        interactions: interactions?.interactions || [],
        conversionAnalysis: conversion,
        exportDate: new Date().toISOString(),
        period: {
          startDate,
          endDate,
        },
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pinteya-analytics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando datos:', error)
      alert('Error al exportar datos. Por favor, intenta nuevamente.')
    }
  }

  // ✅ BYPASS: Si BYPASS_AUTH está activo, permitir acceso sin verificar sesión
  const isBypassActive = bypassAuth === true || bypassAuthEnv
  
  // Mostrar pantalla de carga mientras se verifica el bypass o se carga la sesión
  if (bypassAuth === null || (!isBypassActive && !isLoaded)) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Cargando...</p>
        </div>
      </div>
    )
  }

  // Verificar si el usuario tiene permisos - Usar rol de la sesión directamente (solo si no hay bypass)
  const userRole = user ? (user as any)?.role : null
  
  // Si no hay usuario y no hay bypass, redirigir (ya se maneja en useEffect, pero por si acaso)
  if (!isBypassActive && !user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Redirigiendo...</p>
        </div>
      </div>
    )
  }
  
  // Si el usuario tiene un rol y no es admin y no hay bypass, mostrar acceso denegado
  if (!isBypassActive && userRole && userRole !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg'>
            <h3 className='font-bold text-lg mb-2'>Acceso Denegado</h3>
            <p>No tienes permisos para acceder al dashboard de analytics.</p>
            <p className='text-sm mt-2'>Contacta al administrador si necesitas acceso.</p>
          </div>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Analytics' },
  ]

  const actions = (
    <div className='flex items-center gap-2 sm:gap-3'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleRefresh}
        disabled={isRefreshing}
        className='flex items-center gap-2'
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className='hidden sm:inline'>Actualizar</span>
      </Button>
      <Button
        variant='default'
        size='sm'
        onClick={exportData}
        className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
      >
        <Download className='w-4 h-4' />
        <span className='hidden sm:inline'>Exportar</span>
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-yellow-400'
      >
        <Settings className='w-4 h-4' />
        <span className='hidden sm:inline'>Configurar</span>
      </Button>
    </div>
  )

  return (
    <AdminLayout title='Analytics Dashboard' breadcrumbs={breadcrumbs} actions={actions}>
      <AdminContentWrapper>
        <div className='space-y-6'>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className='w-full'
          >
            <div className='flex justify-center sm:justify-start mb-4'>
              <TabsList className='bg-gray-100 p-1 rounded-lg'>
                <TabsTrigger
                  value='dashboard'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 sm:px-6 py-2.5 flex items-center gap-2'
                >
                  <BarChart3 className='w-4 h-4' />
                  <span className='hidden sm:inline'>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger
                  value='funnel'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 sm:px-6 py-2.5 flex items-center gap-2'
                >
                  <TrendingUp className='w-4 h-4' />
                  <span className='hidden sm:inline'>Embudo</span>
                </TabsTrigger>
                <TabsTrigger
                  value='heatmap'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 sm:px-6 py-2.5 flex items-center gap-2'
                >
                  <Eye className='w-4 h-4' />
                  <span className='hidden sm:inline'>Mapa de Calor</span>
                </TabsTrigger>
                <TabsTrigger
                  value='google'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 sm:px-6 py-2.5 flex items-center gap-2'
                >
                  <BarChart3 className='w-4 h-4' />
                  <span className='hidden sm:inline'>Google Analytics</span>
                </TabsTrigger>
                <TabsTrigger
                  value='meta'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 sm:px-6 py-2.5 flex items-center gap-2'
                >
                  <Eye className='w-4 h-4' />
                  <span className='hidden sm:inline'>Meta Pixel</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value='dashboard' className='mt-0'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnalyticsDashboard />
              </motion.div>
            </TabsContent>

            <TabsContent value='funnel' className='mt-0'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Embudo de Conversión</CardTitle>
                    <CardDescription>
                      Visualiza el flujo de usuarios desde la vista de producto hasta la compra
                      completada. Identifica puntos de abandono y oportunidades de optimización.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConversionFunnel data={conversionData} />
                  </CardContent>
                </Card>

                {/* Métricas adicionales del embudo */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Puntos de Mejora</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingAnalysis ? (
                        <div className='text-center py-4'>
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto'></div>
                          <p className='text-sm text-gray-500 mt-2'>Cargando análisis...</p>
                        </div>
                      ) : conversionAnalysis?.improvements.length ? (
                        <div className='space-y-3'>
                          {conversionAnalysis.improvements.map((improvement, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                improvement.severity === 'high'
                                  ? 'bg-red-50'
                                  : improvement.severity === 'medium'
                                    ? 'bg-yellow-50'
                                    : 'bg-orange-50'
                              }`}
                            >
                              <span
                                className={
                                  improvement.severity === 'high'
                                    ? 'text-red-800'
                                    : improvement.severity === 'medium'
                                      ? 'text-yellow-800'
                                      : 'text-orange-800'
                                }
                              >
                                {improvement.label}
                              </span>
                              <span
                                className={`font-medium ${
                                  improvement.severity === 'high'
                                    ? 'text-red-600'
                                    : improvement.severity === 'medium'
                                      ? 'text-yellow-600'
                                      : 'text-orange-600'
                                }`}
                              >
                                {improvement.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-gray-500 text-sm'>No hay puntos de mejora identificados</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Fortalezas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingAnalysis ? (
                        <div className='text-center py-4'>
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto'></div>
                          <p className='text-sm text-gray-500 mt-2'>Cargando análisis...</p>
                        </div>
                      ) : conversionAnalysis?.strengths.length ? (
                        <div className='space-y-3'>
                          {conversionAnalysis.strengths.map((strength, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                strength.severity === 'high'
                                  ? 'bg-green-50'
                                  : strength.severity === 'medium'
                                    ? 'bg-blue-50'
                                    : 'bg-teal-50'
                              }`}
                            >
                              <span
                                className={
                                  strength.severity === 'high'
                                    ? 'text-green-800'
                                    : strength.severity === 'medium'
                                      ? 'text-blue-800'
                                      : 'text-teal-800'
                                }
                              >
                                {strength.label}
                              </span>
                              <span
                                className={`font-medium ${
                                  strength.severity === 'high'
                                    ? 'text-green-600'
                                    : strength.severity === 'medium'
                                      ? 'text-blue-600'
                                      : 'text-teal-600'
                                }`}
                              >
                                {strength.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-gray-500 text-sm'>No hay fortalezas identificadas</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value='heatmap' className='mt-0'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Mapa de Calor de Interacciones</CardTitle>
                    <CardDescription>
                      Visualiza dónde los usuarios hacen click, hover y scroll en tus páginas.
                      Identifica patrones de comportamiento y optimiza la experiencia de usuario.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingInteractions ? (
                      <div className='text-center py-8'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto'></div>
                        <p className='text-sm text-gray-500 mt-4'>Cargando interacciones...</p>
                      </div>
                    ) : (
                      <HeatmapViewer
                        interactions={interactions}
                        page={typeof window !== 'undefined' ? window.location.pathname : '/'}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Análisis de páginas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis por Página</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pageInteractions.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {pageInteractions.slice(0, 3).map((stat, index) => {
                          const colors = [
                            { bg: 'bg-blue-50', text: 'text-blue-600', label: 'text-blue-800' },
                            { bg: 'bg-green-50', text: 'text-green-600', label: 'text-green-800' },
                            { bg: 'bg-purple-50', text: 'text-purple-600', label: 'text-purple-800' },
                          ]
                          const color = colors[index] || colors[0]
                          const pageName =
                            stat.page === '/' ? 'Home' : stat.page.split('/').filter(Boolean).pop() || stat.page

                          return (
                            <div key={stat.page} className={`text-center p-4 ${color.bg} rounded-lg`}>
                              <p className={`text-2xl font-bold ${color.text}`}>
                                {stat.interactions.toLocaleString()}
                              </p>
                              <p className={`text-sm ${color.label}`}>Interacciones en {pageName}</p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className='text-gray-500 text-sm text-center py-4'>
                        No hay datos de interacciones disponibles
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value='google' className='mt-0'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Google Analytics</CardTitle>
                    <CardDescription>
                      Visualización de métricas y reportes de Google Analytics 4. Los reportes embebidos
                      requieren que tengas acceso a la cuenta de Google Analytics asociada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleAnalyticsEmbed />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value='meta' className='mt-0'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Meta Pixel Analytics</CardTitle>
                    <CardDescription>
                      Métricas basadas en eventos trackeados por el Meta Pixel. Estos datos muestran los
                      eventos que se están enviando desde nuestro sistema al Pixel de Meta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MetaMetrics
                      startDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
                      endDate={new Date().toISOString()}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminContentWrapper>
    </AdminLayout>
  )
}

export default AnalyticsPage
