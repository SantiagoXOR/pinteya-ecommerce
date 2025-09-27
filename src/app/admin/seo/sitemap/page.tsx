'use client'

// ===================================
// PINTEYA E-COMMERCE - SITEMAP MANAGER DASHBOARD
// Dashboard para gestión de sitemaps XML
// ===================================

import React, { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Globe,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Search,
  Link,
  Settings,
  Eye,
  ExternalLink,
  Calendar,
  TrendingUp,
} from 'lucide-react'

// ===================================
// INTERFACES
// ===================================

interface SitemapStats {
  totalUrls: number
  lastGenerated: Date
  fileSize: string
  compressionEnabled: boolean
  indexSitemapEnabled: boolean
  generationTime: number
  cacheHitRate: number
  errors: number
  warnings: number
}

interface SitemapUrl {
  url: string
  lastmod: Date
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
  type: 'homepage' | 'categories' | 'products' | 'staticPages' | 'blogPosts'
  status: 'included' | 'excluded' | 'error'
}

interface SitemapFile {
  filename: string
  urls: number
  size: string
  lastModified: Date
  status: 'active' | 'generating' | 'error'
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function SitemapManagerDashboard() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [stats, setStats] = useState<SitemapStats | null>(null)
  const [urls, setUrls] = useState<SitemapUrl[]>([])
  const [sitemapFiles, setSitemapFiles] = useState<SitemapFile[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadSitemapData()
  }, [])

  // ===================================
  // FUNCIONES
  // ===================================

  const loadSitemapData = async () => {
    try {
      setLoading(true)

      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockStats: SitemapStats = {
        totalUrls: 1247,
        lastGenerated: new Date(Date.now() - 3600000),
        fileSize: '2.4 MB',
        compressionEnabled: true,
        indexSitemapEnabled: true,
        generationTime: 15420,
        cacheHitRate: 0.92,
        errors: 2,
        warnings: 5,
      }

      const mockUrls: SitemapUrl[] = [
        {
          url: '/',
          lastmod: new Date(),
          changefreq: 'daily',
          priority: 1.0,
          type: 'homepage',
          status: 'included',
        },
        {
          url: '/shop',
          lastmod: new Date(Date.now() - 86400000),
          changefreq: 'weekly',
          priority: 0.8,
          type: 'categories',
          status: 'included',
        },
        {
          url: '/products/pintura-interior-premium',
          lastmod: new Date(Date.now() - 172800000),
          changefreq: 'weekly',
          priority: 0.7,
          type: 'products',
          status: 'included',
        },
        {
          url: '/categories/pinturas-exteriores',
          lastmod: new Date(Date.now() - 259200000),
          changefreq: 'weekly',
          priority: 0.8,
          type: 'categories',
          status: 'included',
        },
        {
          url: '/blog/como-elegir-pintura',
          lastmod: new Date(Date.now() - 604800000),
          changefreq: 'monthly',
          priority: 0.5,
          type: 'blogPosts',
          status: 'included',
        },
      ]

      const mockFiles: SitemapFile[] = [
        {
          filename: 'sitemap.xml',
          urls: 1247,
          size: '2.4 MB',
          lastModified: new Date(Date.now() - 3600000),
          status: 'active',
        },
        {
          filename: 'sitemap-products.xml',
          urls: 850,
          size: '1.8 MB',
          lastModified: new Date(Date.now() - 3600000),
          status: 'active',
        },
        {
          filename: 'sitemap-categories.xml',
          urls: 45,
          size: '120 KB',
          lastModified: new Date(Date.now() - 3600000),
          status: 'active',
        },
      ]

      setStats(mockStats)
      setUrls(mockUrls)
      setSitemapFiles(mockFiles)
    } catch (error) {
      console.error('Error loading sitemap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSitemap = async () => {
    try {
      setGenerating(true)

      // Simular generación
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Actualizar stats
      if (stats) {
        setStats({
          ...stats,
          lastGenerated: new Date(),
          generationTime: Math.floor(Math.random() * 10000) + 5000,
        })
      }

      await loadSitemapData()
    } catch (error) {
      console.error('Error generating sitemap:', error)
    } finally {
      setGenerating(false)
    }
  }

  const getTypeColor = (type: SitemapUrl['type']) => {
    switch (type) {
      case 'homepage':
        return 'bg-blue-100 text-blue-800'
      case 'categories':
        return 'bg-green-100 text-green-800'
      case 'products':
        return 'bg-purple-100 text-purple-800'
      case 'staticPages':
        return 'bg-gray-100 text-gray-800'
      case 'blogPosts':
        return 'bg-orange-100 text-orange-800'
    }
  }

  const getStatusIcon = (status: SitemapUrl['status']) => {
    switch (status) {
      case 'included':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'excluded':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />
      case 'error':
        return <AlertTriangle className='h-4 w-4 text-red-500' />
    }
  }

  const filteredUrls = urls.filter(url => url.url.toLowerCase().includes(searchTerm.toLowerCase()))

  const formatFileSize = (size: string) => size
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`

  // ===================================
  // RENDER
  // ===================================

  if (loading) {
    return (
      <AdminLayout
        title='Sitemap Manager'
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'SEO Dashboard', href: '/admin/seo' },
          { label: 'Sitemap' },
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
      title='Sitemap Manager'
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'SEO Dashboard', href: '/admin/seo' },
        { label: 'Sitemap' },
      ]}
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={loadSitemapData} disabled={generating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size='sm' onClick={generateSitemap} disabled={generating}>
            {generating ? (
              <>
                <Clock className='h-4 w-4 mr-2 animate-spin' />
                Generando...
              </>
            ) : (
              <>
                <RefreshCw className='h-4 w-4 mr-2' />
                Generar Sitemap
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className='space-y-6'>
        {/* Estadísticas Generales */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total URLs</CardTitle>
                <Globe className='h-4 w-4 text-blue-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.totalUrls.toLocaleString()}</div>
                <p className='text-xs text-gray-500'>En sitemap principal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Tamaño Total</CardTitle>
                <FileText className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.fileSize}</div>
                <p className='text-xs text-gray-500'>
                  {stats.compressionEnabled ? 'Comprimido' : 'Sin comprimir'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Última Generación</CardTitle>
                <Calendar className='h-4 w-4 text-purple-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {Math.floor((Date.now() - stats.lastGenerated.getTime()) / 3600000)}h
                </div>
                <p className='text-xs text-gray-500'>
                  {formatDuration(stats.generationTime)} de ejecución
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Cache Hit Rate</CardTitle>
                <TrendingUp className='h-4 w-4 text-orange-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{(stats.cacheHitRate * 100).toFixed(1)}%</div>
                <Progress value={stats.cacheHitRate * 100} className='mt-2' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertas */}
        {stats && (stats.errors > 0 || stats.warnings > 0) && (
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              {stats.errors > 0 && `${stats.errors} errores detectados. `}
              {stats.warnings > 0 && `${stats.warnings} advertencias encontradas.`}
              <Button variant='link' className='p-0 h-auto ml-2'>
                Ver detalles →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs de Contenido */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='urls'>URLs</TabsTrigger>
            <TabsTrigger value='files'>Archivos</TabsTrigger>
            <TabsTrigger value='settings'>Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* Archivos de Sitemap */}
            <Card>
              <CardHeader>
                <CardTitle>Archivos de Sitemap</CardTitle>
                <CardDescription>Archivos XML generados y su estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {sitemapFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <FileText className='h-5 w-5 text-blue-500' />
                        <div>
                          <h4 className='font-medium'>{file.filename}</h4>
                          <p className='text-sm text-gray-500'>
                            {file.urls.toLocaleString()} URLs • {file.size}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <div className='text-sm text-gray-500'>
                            {file.lastModified.toLocaleString()}
                          </div>
                          <Badge
                            className={
                              file.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : file.status === 'generating'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {file.status === 'active'
                              ? 'Activo'
                              : file.status === 'generating'
                                ? 'Generando'
                                : 'Error'}
                          </Badge>
                        </div>
                        <div className='flex gap-2'>
                          <Button variant='outline' size='sm'>
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button variant='outline' size='sm'>
                            <Download className='h-4 w-4' />
                          </Button>
                          <Button variant='outline' size='sm'>
                            <ExternalLink className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de URLs por Tipo</CardTitle>
                <CardDescription>Análisis de contenido incluido en el sitemap</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {['homepage', 'categories', 'products', 'staticPages', 'blogPosts'].map(type => {
                    const count = urls.filter(url => url.type === type).length
                    const percentage = (count / urls.length) * 100

                    return (
                      <div key={type} className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <Badge className={getTypeColor(type as SitemapUrl['type'])}>
                            {type === 'homepage'
                              ? 'Homepage'
                              : type === 'categories'
                                ? 'Categorías'
                                : type === 'products'
                                  ? 'Productos'
                                  : type === 'staticPages'
                                    ? 'Páginas Estáticas'
                                    : 'Blog Posts'}
                          </Badge>
                          <span className='text-sm'>{count} URLs</span>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Progress value={percentage} className='w-24' />
                          <span className='text-sm font-medium'>{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='urls' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>URLs en Sitemap</CardTitle>
                <CardDescription>Lista completa de URLs incluidas en el sitemap</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex gap-4'>
                    <Input
                      placeholder='Buscar URLs...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='max-w-sm'
                    />
                    <Button variant='outline'>
                      <Search className='h-4 w-4 mr-2' />
                      Filtros
                    </Button>
                  </div>

                  <div className='space-y-2'>
                    {filteredUrls.slice(0, 10).map((url, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          {getStatusIcon(url.status)}
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>{url.url}</div>
                            <div className='text-xs text-gray-500'>
                              Última modificación: {url.lastmod.toLocaleDateString()} • Frecuencia:{' '}
                              {url.changefreq} • Prioridad: {url.priority}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Badge className={getTypeColor(url.type)}>{url.type}</Badge>
                          <Button variant='outline' size='sm'>
                            <ExternalLink className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredUrls.length > 10 && (
                    <div className='text-center'>
                      <Button variant='outline'>
                        Cargar más URLs ({filteredUrls.length - 10} restantes)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='files' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Archivos</CardTitle>
                <CardDescription>Administrar archivos de sitemap XML</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Button className='h-20 flex flex-col'>
                      <Download className='h-6 w-6 mb-2' />
                      Descargar Sitemap
                    </Button>
                    <Button variant='outline' className='h-20 flex flex-col'>
                      <Upload className='h-6 w-6 mb-2' />
                      Subir Sitemap
                    </Button>
                    <Button variant='outline' className='h-20 flex flex-col'>
                      <Settings className='h-6 w-6 mb-2' />
                      Configurar
                    </Button>
                  </div>

                  <div className='space-y-4'>
                    {sitemapFiles.map((file, index) => (
                      <div key={index} className='border rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-medium'>{file.filename}</h4>
                          <Badge
                            className={
                              file.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {file.status === 'active' ? 'Activo' : 'Error'}
                          </Badge>
                        </div>

                        <div className='grid grid-cols-3 gap-4 text-sm mb-4'>
                          <div>
                            <span className='text-gray-500'>URLs:</span>
                            <div className='font-semibold'>{file.urls.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className='text-gray-500'>Tamaño:</span>
                            <div className='font-semibold'>{file.size}</div>
                          </div>
                          <div>
                            <span className='text-gray-500'>Modificado:</span>
                            <div className='font-semibold'>
                              {file.lastModified.toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className='flex gap-2'>
                          <Button variant='outline' size='sm'>
                            <Eye className='h-4 w-4 mr-2' />
                            Ver
                          </Button>
                          <Button variant='outline' size='sm'>
                            <Download className='h-4 w-4 mr-2' />
                            Descargar
                          </Button>
                          <Button variant='outline' size='sm'>
                            <ExternalLink className='h-4 w-4 mr-2' />
                            Abrir
                          </Button>
                          <Button variant='outline' size='sm'>
                            <RefreshCw className='h-4 w-4 mr-2' />
                            Regenerar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='settings' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Sitemap</CardTitle>
                <CardDescription>Ajustes para la generación automática de sitemaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='text-sm font-medium'>URLs máximas por sitemap</label>
                      <Input type='number' defaultValue='50000' className='mt-1' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Frecuencia de generación</label>
                      <select className='w-full mt-1 p-2 border rounded'>
                        <option>Diaria</option>
                        <option>Semanal</option>
                        <option>Manual</option>
                      </select>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium'>Habilitar compresión</h4>
                        <p className='text-sm text-gray-500'>
                          Comprimir archivos XML para reducir tamaño
                        </p>
                      </div>
                      <input type='checkbox' defaultChecked />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium'>Sitemap índice</h4>
                        <p className='text-sm text-gray-500'>
                          Crear sitemap índice para múltiples archivos
                        </p>
                      </div>
                      <input type='checkbox' defaultChecked />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium'>Incluir imágenes</h4>
                        <p className='text-sm text-gray-500'>
                          Agregar información de imágenes al sitemap
                        </p>
                      </div>
                      <input type='checkbox' defaultChecked />
                    </div>
                  </div>

                  <Button>
                    <Settings className='h-4 w-4 mr-2' />
                    Guardar Configuración
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
