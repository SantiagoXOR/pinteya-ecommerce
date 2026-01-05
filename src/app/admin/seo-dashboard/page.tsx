// ===================================
// PINTEYA E-COMMERCE - SEO DASHBOARD
// Panel administrativo para gestionar y monitorear SEO
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Globe,
  FileText,
  Settings,
  Download,
  RefreshCw,
} from '@/lib/optimized-imports'

// Importar managers SEO
// import { seoAnalyticsManager } from '@/lib/seo/seo-analytics-manager'; // Comentado temporalmente para build
// import { dynamicSitemapGenerator } from '@/lib/seo/dynamic-sitemap-generator'; // Comentado temporalmente para build
// import { seoOptimizationTools } from '@/lib/seo/seo-optimization-tools'; // Comentado temporalmente para build

interface SEODashboardData {
  metrics: any
  keywords: any[]
  alerts: any[]
  sitemapStats: any
  overallScore: number
}

export default function SEODashboard() {
  const [data, setData] = useState<SEODashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Mock data para desarrollo
      const metrics = {
        organicTraffic: 1250,
        averagePosition: 15.2,
        clickThroughRate: 3.8,
        indexedPages: 45,
      }
      const keywords = []
      const alerts = []
      const sitemapStats = { totalUrls: 0, lastGenerated: new Date() }
      const overallScore = 75 // Mock score

      setData({
        metrics,
        keywords,
        alerts,
        sitemapStats,
        overallScore,
      })
    } catch (error) {
      console.error('Error cargando datos SEO:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const downloadSitemap = async () => {
    try {
      // const sitemap = await dynamicSitemapGenerator.generateSitemap(); // Comentado temporalmente
      const sitemap =
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>' // Mock
      const blob = new Blob([sitemap], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sitemap.xml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error descargando sitemap:', error)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Cargando datos SEO...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los datos SEO. Intenta refrescar la página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Dashboard SEO</h1>
          <p className='text-muted-foreground'>
            Monitoreo y optimización SEO para Pinteya E-commerce
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={refreshData} disabled={refreshing} variant='outline'>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={downloadSitemap} variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Descargar Sitemap
          </Button>
        </div>
      </div>

      {/* Score General */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Score SEO General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <div className='text-4xl font-bold text-primary'>{data.overallScore}</div>
            <div className='flex-1'>
              <Progress value={data.overallScore} className='h-3' />
              <p className='text-sm text-muted-foreground mt-1'>
                {data.overallScore >= 80
                  ? 'Excelente'
                  : data.overallScore >= 60
                    ? 'Bueno'
                    : data.overallScore >= 40
                      ? 'Regular'
                      : 'Necesita mejoras'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Activas */}
      {data.alerts.length > 0 && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Alertas SEO Activas</AlertTitle>
          <AlertDescription>
            Tienes {data.alerts.length} alertas que requieren atención.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>Resumen</TabsTrigger>
          <TabsTrigger value='keywords'>Keywords</TabsTrigger>
          <TabsTrigger value='technical'>Técnico</TabsTrigger>
          <TabsTrigger value='content'>Contenido</TabsTrigger>
          <TabsTrigger value='sitemap'>Sitemap</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Tráfico Orgánico</CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {data.metrics.organicTraffic.toLocaleString()}
                </div>
                <p className='text-xs text-muted-foreground'>+12% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Impresiones</CardTitle>
                <Eye className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {data.metrics.searchImpressions.toLocaleString()}
                </div>
                <p className='text-xs text-muted-foreground'>+8% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>CTR Promedio</CardTitle>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{data.metrics.ctr.toFixed(1)}%</div>
                <p className='text-xs text-muted-foreground'>+0.5% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Posición Promedio</CardTitle>
                <BarChart3 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{data.metrics.avgPosition.toFixed(1)}</div>
                <p className='text-xs text-muted-foreground'>-2.3 desde el mes pasado</p>
              </CardContent>
            </Card>
          </div>

          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>Métricas de rendimiento que afectan el SEO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold mb-1'>
                    {(data.metrics.coreWebVitals.lcp / 1000).toFixed(1)}s
                  </div>
                  <div className='text-sm text-muted-foreground'>LCP</div>
                  <Badge
                    variant={data.metrics.coreWebVitals.lcp <= 2500 ? 'default' : 'destructive'}
                  >
                    {data.metrics.coreWebVitals.lcp <= 2500 ? 'Bueno' : 'Necesita mejora'}
                  </Badge>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold mb-1'>
                    {data.metrics.coreWebVitals.fid.toFixed(0)}ms
                  </div>
                  <div className='text-sm text-muted-foreground'>FID</div>
                  <Badge
                    variant={data.metrics.coreWebVitals.fid <= 100 ? 'default' : 'destructive'}
                  >
                    {data.metrics.coreWebVitals.fid <= 100 ? 'Bueno' : 'Necesita mejora'}
                  </Badge>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold mb-1'>
                    {data.metrics.coreWebVitals.cls.toFixed(3)}
                  </div>
                  <div className='text-sm text-muted-foreground'>CLS</div>
                  <Badge
                    variant={data.metrics.coreWebVitals.cls <= 0.1 ? 'default' : 'destructive'}
                  >
                    {data.metrics.coreWebVitals.cls <= 0.1 ? 'Bueno' : 'Necesita mejora'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Keywords */}
        <TabsContent value='keywords' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Keywords</CardTitle>
              <CardDescription>Top keywords y su rendimiento en búsquedas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {data.keywords.slice(0, 10).map((keyword, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex-1'>
                      <div className='font-medium'>{keyword.keyword}</div>
                      <div className='text-sm text-muted-foreground'>
                        Volumen: {keyword.searchVolume.toLocaleString()} | Dificultad:{' '}
                        {keyword.difficulty}
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold'>#{keyword.position}</div>
                      <div className='flex items-center text-sm'>
                        {keyword.trend === 'up' ? (
                          <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                        ) : keyword.trend === 'down' ? (
                          <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
                        ) : null}
                        {keyword.ctr.toFixed(1)}% CTR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Técnico */}
        <TabsContent value='technical' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Estado de Indexación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span>Páginas totales:</span>
                    <span className='font-medium'>{data.metrics.indexationStatus.totalPages}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Páginas indexadas:</span>
                    <span className='font-medium text-green-600'>
                      {data.metrics.indexationStatus.indexedPages}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Tasa de indexación:</span>
                    <span className='font-medium'>
                      {data.metrics.indexationStatus.indexationRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.metrics.indexationStatus.indexationRate} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Técnico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span>Usabilidad móvil:</span>
                    <span className='font-medium'>
                      {data.metrics.technicalSEO.mobileUsability}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>PageSpeed:</span>
                    <span className='font-medium'>{data.metrics.technicalSEO.pagespeedScore}%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>HTTPS:</span>
                    <span className='font-medium text-green-600'>
                      {data.metrics.technicalSEO.httpsUsage}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Meta tags:</span>
                    <span className='font-medium'>
                      {data.metrics.technicalSEO.metaTagsOptimization}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Contenido */}
        <TabsContent value='content' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Contenido</CardTitle>
              <CardDescription>
                Herramientas para optimizar el contenido de tus páginas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='url-analyze'>URL a analizar</Label>
                  <Input id='url-analyze' placeholder='https://pinteya-ecommerce.vercel.app/...' />
                </div>
                <Button>
                  <Search className='h-4 w-4 mr-2' />
                  Analizar Contenido
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sitemap */}
        <TabsContent value='sitemap' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sitemap</CardTitle>
              <CardDescription>
                Información sobre el sitemap generado automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span>Total de URLs:</span>
                    <span className='font-medium'>{data.sitemapStats.totalUrls}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Páginas estáticas:</span>
                    <span className='font-medium'>{data.sitemapStats.staticPages}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Páginas de productos:</span>
                    <span className='font-medium'>{data.sitemapStats.productPages}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Páginas de categorías:</span>
                    <span className='font-medium'>{data.sitemapStats.categoryPages}</span>
                  </div>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span>Tamaño del archivo:</span>
                    <span className='font-medium'>
                      {(data.sitemapStats.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Última generación:</span>
                    <span className='font-medium'>
                      {new Date(data.sitemapStats.lastGenerated).toLocaleDateString()}
                    </span>
                  </div>
                  <Button onClick={downloadSitemap} className='w-full'>
                    <Download className='h-4 w-4 mr-2' />
                    Descargar Sitemap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
