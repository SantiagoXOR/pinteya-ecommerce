'use client';

// ===================================
// PINTEYA E-COMMERCE - SEO ADMINISTRATIVE DASHBOARD
// Dashboard principal para gestión completa de SEO
// ===================================

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Globe,
  Zap,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Target,
  Activity,
  Clock,
  Users,
  MousePointer
} from 'lucide-react';
import Link from 'next/link';

// ===================================
// INTERFACES
// ===================================

interface SEOOverviewData {
  overallScore: number;
  organicTraffic: number;
  averagePosition: number;
  indexationRate: number;
  coreWebVitalsScore: string;
  unresolvedAlerts: number;
  lastUpdated: Date;
}

interface SEOMetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface SEOAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  url?: string;
  timestamp: Date;
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function SEOAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<SEOOverviewData | null>(null);
  const [alerts, setAlerts] = useState<SEOAlert[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ===================================
  // FUNCIONES
  // ===================================

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos (en producción vendría de las APIs)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOverview: SEOOverviewData = {
        overallScore: 87,
        organicTraffic: 12450,
        averagePosition: 3.2,
        indexationRate: 94.5,
        coreWebVitalsScore: 'good',
        unresolvedAlerts: 3,
        lastUpdated: new Date()
      };

      const mockAlerts: SEOAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Meta descriptions faltantes',
          description: '5 páginas no tienen meta description',
          url: '/admin/seo/metadata',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'critical',
          title: 'Structured data inválido',
          description: 'Error en schema de productos',
          url: '/admin/seo/schema',
          timestamp: new Date()
        },
        {
          id: '3',
          type: 'info',
          title: 'Sitemap actualizado',
          description: 'Se agregaron 15 nuevas URLs',
          timestamp: new Date()
        }
      ];

      setOverview(mockOverview);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading SEO dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {return 'text-green-600';}
    if (score >= 60) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) {return 'bg-green-100 text-green-800';}
    if (score >= 60) {return 'bg-yellow-100 text-yellow-800';}
    return 'bg-red-100 text-red-800';
  };

  const getAlertIcon = (type: SEOAlert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  // ===================================
  // MÉTRICAS PRINCIPALES
  // ===================================

  const getMainMetrics = (): SEOMetricCard[] => {
    if (!overview) {return [];}

    return [
      {
        title: 'SEO Score General',
        value: overview.overallScore,
        change: 5,
        trend: 'up',
        icon: <Target className="h-5 w-5" />,
        color: 'text-blue-600',
        description: 'Puntuación general de SEO'
      },
      {
        title: 'Tráfico Orgánico',
        value: overview.organicTraffic.toLocaleString(),
        change: 12,
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'text-green-600',
        description: 'Visitantes desde búsquedas'
      },
      {
        title: 'Posición Promedio',
        value: overview.averagePosition.toFixed(1),
        change: -0.3,
        trend: 'up',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-purple-600',
        description: 'Posición promedio en SERPs'
      },
      {
        title: 'Indexación',
        value: `${overview.indexationRate}%`,
        change: 2,
        trend: 'up',
        icon: <Globe className="h-5 w-5" />,
        color: 'text-indigo-600',
        description: 'Páginas indexadas por Google'
      },
      {
        title: 'Core Web Vitals',
        value: overview.coreWebVitalsScore,
        icon: <Zap className="h-5 w-5" />,
        color: overview.coreWebVitalsScore === 'good' ? 'text-green-600' : 'text-yellow-600',
        description: 'Estado de métricas de rendimiento'
      },
      {
        title: 'Alertas Activas',
        value: overview.unresolvedAlerts,
        icon: <AlertTriangle className="h-5 w-5" />,
        color: overview.unresolvedAlerts > 0 ? 'text-red-600' : 'text-green-600',
        description: 'Issues que requieren atención'
      }
    ];
  };

  // ===================================
  // SECCIONES RÁPIDAS
  // ===================================

  const quickActions = [
    {
      title: 'Analytics SEO',
      description: 'Métricas detalladas y reportes',
      href: '/admin/seo/analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-blue-500',
      badge: 'Enterprise'
    },
    {
      title: 'Testing Suite',
      description: 'Tests automatizados de SEO',
      href: '/admin/seo/testing',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'bg-green-500',
      badge: 'New'
    },
    {
      title: 'Optimization Tools',
      description: 'Herramientas de optimización',
      href: '/admin/seo/optimization',
      icon: <Zap className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Sitemap Manager',
      description: 'Gestión de sitemaps XML',
      href: '/admin/seo/sitemap',
      icon: <Globe className="h-6 w-6" />,
      color: 'bg-indigo-500'
    },
    {
      title: 'Schema Markup',
      description: 'Structured data y validación',
      href: '/admin/seo/schema',
      icon: <Activity className="h-6 w-6" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Configuración',
      description: 'Settings y configuración SEO',
      href: '/admin/seo/settings',
      icon: <Settings className="h-6 w-6" />,
      color: 'bg-gray-500'
    }
  ];

  // ===================================
  // RENDER
  // ===================================

  if (loading) {
    return (
      <AdminLayout title="SEO Dashboard" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'SEO Dashboard' }]}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="SEO Dashboard" 
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'SEO Dashboard' }]}
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header con Score General */}
        {overview && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">SEO Score General</CardTitle>
                  <CardDescription>
                    Última actualización: {overview.lastUpdated.toLocaleString()}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getScoreColor(overview.overallScore)}`}>
                    {overview.overallScore}/100
                  </div>
                  <Badge className={getScoreBadgeColor(overview.overallScore)}>
                    {overview.overallScore >= 80 ? 'Excelente' : overview.overallScore >= 60 ? 'Bueno' : 'Necesita Mejoras'}
                  </Badge>
                </div>
              </div>
              <Progress value={overview.overallScore} className="mt-4" />
            </CardHeader>
          </Card>
        )}

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getMainMetrics().map((metric, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {metric.value}
                  </div>
                  {metric.change !== undefined && (
                    <div className={`flex items-center text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : null}
                      {Math.abs(metric.change)}%
                    </div>
                  )}
                </div>
                {metric.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alertas Recientes */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Recientes
              </CardTitle>
              <CardDescription>
                Issues que requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <Alert key={alert.id} className="border-l-4 border-l-gray-200">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{alert.title}</h4>
                          <span className="text-xs text-gray-500">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <AlertDescription className="mt-1">
                          {alert.description}
                        </AlertDescription>
                        {alert.url && (
                          <Link href={alert.url} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                            Ver detalles →
                          </Link>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Herramientas SEO</CardTitle>
            <CardDescription>
              Acceso rápido a todas las funcionalidades de SEO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          {action.icon}
                        </div>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}









