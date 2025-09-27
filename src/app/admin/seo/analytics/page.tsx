'use client'

// ===================================
// PINTEYA E-COMMERCE - SEO ANALYTICS DASHBOARD
// Dashboard detallado de analytics y métricas SEO
// ===================================

import React, { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Clock,
  Globe,
  Search,
  Users,
  Target,
  Download,
  RefreshCw,
  Calendar,
  Filter,
} from 'lucide-react'

// ===================================
// INTERFACES
// ===================================

interface AnalyticsMetrics {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  organicTraffic: number
  searchImpressions: number
  searchClicks: number
  avgPosition: number
  ctr: number
  conversionRate: number
  revenueFromOrganic: number
}

interface KeywordData {
  keyword: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  change: number
}

interface PageMetrics {
  url: string
  pageViews: number
  organicTraffic: number
  bounceRate: number
  avgPosition: number
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function SEOAnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [keywords, setKeywords] = useState<KeywordData[]>([])
  const [topPages, setTopPages] = useState<PageMetrics[]>([])
  const [dateRange, setDateRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  // ===================================
  // FUNCIONES
  // ===================================

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      // Simular carga de datos (en producción vendría de la API)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockMetrics: AnalyticsMetrics = {
        pageViews: 45230,
        uniqueVisitors: 12450,
        bounceRate: 42.3,
        avgSessionDuration: 185,
        organicTraffic: 8920,
        searchImpressions: 125000,
        searchClicks: 3200,
        avgPosition: 3.2,
        ctr: 2.56,
        conversionRate: 3.8,
        revenueFromOrganic: 15420,
      }

      const mockKeywords: KeywordData[] = [
        {
          keyword: 'pintura interior',
          position: 2.1,
          impressions: 15000,
          clicks: 450,
          ctr: 3.0,
          change: 5,
        },
        {
          keyword: 'pintura exterior',
          position: 3.5,
          impressions: 12000,
          clicks: 320,
          ctr: 2.7,
          change: -2,
        },
        {
          keyword: 'esmalte sintético',
          position: 1.8,
          impressions: 8500,
          clicks: 380,
          ctr: 4.5,
          change: 12,
        },
        {
          keyword: 'pintura acrílica',
          position: 4.2,
          impressions: 9200,
          clicks: 180,
          ctr: 2.0,
          change: -8,
        },
        {
          keyword: 'barniz madera',
          position: 2.9,
          impressions: 6800,
          clicks: 220,
          ctr: 3.2,
          change: 3,
        },
      ]

      const mockTopPages: PageMetrics[] = [
        {
          url: '/products/pintura-interior-premium',
          pageViews: 5420,
          organicTraffic: 3200,
          bounceRate: 35.2,
          avgPosition: 2.1,
        },
        {
          url: '/categories/pinturas-exteriores',
          pageViews: 4180,
          organicTraffic: 2800,
          bounceRate: 42.1,
          avgPosition: 3.5,
        },
        {
          url: '/products/esmalte-sintetico-blanco',
          pageViews: 3920,
          organicTraffic: 2400,
          bounceRate: 38.7,
          avgPosition: 1.8,
        },
        {
          url: '/blog/como-elegir-pintura-interior',
          pageViews: 3650,
          organicTraffic: 2100,
          bounceRate: 28.9,
          avgPosition: 4.2,
        },
        {
          url: '/products/barniz-madera-natural',
          pageViews: 2890,
          organicTraffic: 1850,
          bounceRate: 41.3,
          avgPosition: 2.9,
        },
      ]

      setMetrics(mockMetrics)
      setKeywords(mockKeywords)
      setTopPages(mockTopPages)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(num)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // ===================================
  // MÉTRICAS PRINCIPALES
  // ===================================

  const getMainMetrics = () => {
    if (!metrics) {
      return []
    }

    return [
      {
        title: 'Page Views',
        value: formatNumber(metrics.pageViews),
        change: 12,
        trend: 'up' as const,
        icon: <Eye className='h-5 w-5' />,
        color: 'text-blue-600',
      },
      {
        title: 'Visitantes Únicos',
        value: formatNumber(metrics.uniqueVisitors),
        change: 8,
        trend: 'up' as const,
        icon: <Users className='h-5 w-5' />,
        color: 'text-green-600',
      },
      {
        title: 'Tráfico Orgánico',
        value: formatNumber(metrics.organicTraffic),
        change: 15,
        trend: 'up' as const,
        icon: <Search className='h-5 w-5' />,
        color: 'text-purple-600',
      },
      {
        title: 'Bounce Rate',
        value: `${metrics.bounceRate}%`,
        change: -3,
        trend: 'up' as const,
        icon: <TrendingDown className='h-5 w-5' />,
        color: 'text-orange-600',
      },
      {
        title: 'Duración Promedio',
        value: formatDuration(metrics.avgSessionDuration),
        change: 5,
        trend: 'up' as const,
        icon: <Clock className='h-5 w-5' />,
        color: 'text-indigo-600',
      },
      {
        title: 'CTR Promedio',
        value: `${metrics.ctr}%`,
        change: 2,
        trend: 'up' as const,
        icon: <MousePointer className='h-5 w-5' />,
        color: 'text-pink-600',
      },
    ]
  }

  // ===================================
  // RENDER
  // ===================================

  if (loading) {
    return (
      <AdminLayout
        title='SEO Analytics'
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'SEO Dashboard', href: '/admin/seo' },
          { label: 'Analytics' },
        ]}
      >
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className='animate-pulse'>
                <CardHeader className='space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title='SEO Analytics'
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'SEO Dashboard', href: '/admin/seo' },
        { label: 'Analytics' },
      ]}
      actions={
        <div className='flex gap-2'>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>7 días</SelectItem>
              <SelectItem value='30d'>30 días</SelectItem>
              <SelectItem value='90d'>90 días</SelectItem>
              <SelectItem value='1y'>1 año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Exportar
          </Button>
        </div>
      }
    >
      <div className='space-y-6'>
        {/* Métricas Principales */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {getMainMetrics().map((metric, index) => (
            <Card key={index} className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>{metric.title}</CardTitle>
                <div className={metric.color}>{metric.icon}</div>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='text-2xl font-bold'>{metric.value}</div>
                  <div
                    className={`flex items-center text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className='h-4 w-4 mr-1' />
                    ) : (
                      <TrendingDown className='h-4 w-4 mr-1' />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs de Contenido */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='keywords'>Keywords</TabsTrigger>
            <TabsTrigger value='pages'>Páginas</TabsTrigger>
            <TabsTrigger value='reports'>Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* Métricas de Search Console */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Search Console</CardTitle>
                  <CardDescription>Métricas de Google Search Console</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Impresiones</span>
                    <span className='font-semibold'>
                      {formatNumber(metrics?.searchImpressions || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Clicks</span>
                    <span className='font-semibold'>
                      {formatNumber(metrics?.searchClicks || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>CTR</span>
                    <span className='font-semibold'>{metrics?.ctr}%</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Posición Promedio</span>
                    <span className='font-semibold'>{metrics?.avgPosition}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversiones</CardTitle>
                  <CardDescription>Métricas de conversión y revenue</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Tasa de Conversión</span>
                    <span className='font-semibold'>{metrics?.conversionRate}%</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Revenue Orgánico</span>
                    <span className='font-semibold'>
                      {formatCurrency(metrics?.revenueFromOrganic || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Revenue por Visita</span>
                    <span className='font-semibold'>
                      {formatCurrency(
                        (metrics?.revenueFromOrganic || 0) / (metrics?.organicTraffic || 1)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='keywords' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Top Keywords</CardTitle>
                <CardDescription>Keywords con mejor rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='font-medium'>{keyword.keyword}</div>
                        <div className='text-sm text-gray-500'>
                          Posición {keyword.position} • {formatNumber(keyword.impressions)}{' '}
                          impresiones
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-semibold'>{formatNumber(keyword.clicks)} clicks</div>
                        <div
                          className={`text-sm flex items-center ${
                            keyword.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {keyword.change > 0 ? (
                            <TrendingUp className='h-3 w-3 mr-1' />
                          ) : (
                            <TrendingDown className='h-3 w-3 mr-1' />
                          )}
                          {Math.abs(keyword.change)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='pages' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Top Landing Pages</CardTitle>
                <CardDescription>Páginas con mejor rendimiento orgánico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {topPages.map((page, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='font-medium text-sm'>{page.url}</div>
                        <div className='text-xs text-gray-500'>
                          Posición promedio: {page.avgPosition} • Bounce rate: {page.bounceRate}%
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-semibold'>{formatNumber(page.organicTraffic)}</div>
                        <div className='text-sm text-gray-500'>tráfico orgánico</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='reports' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Reportes Disponibles</CardTitle>
                <CardDescription>Genera reportes detallados de SEO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Button variant='outline' className='h-20 flex flex-col'>
                    <BarChart3 className='h-6 w-6 mb-2' />
                    Reporte Mensual
                  </Button>
                  <Button variant='outline' className='h-20 flex flex-col'>
                    <Target className='h-6 w-6 mb-2' />
                    Análisis de Keywords
                  </Button>
                  <Button variant='outline' className='h-20 flex flex-col'>
                    <Globe className='h-6 w-6 mb-2' />
                    Auditoría Técnica
                  </Button>
                  <Button variant='outline' className='h-20 flex flex-col'>
                    <TrendingUp className='h-6 w-6 mb-2' />
                    Análisis de Competencia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
