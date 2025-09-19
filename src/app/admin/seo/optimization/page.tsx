'use client';

// ===================================
// PINTEYA E-COMMERCE - SEO OPTIMIZATION DASHBOARD
// Dashboard para herramientas de optimización SEO
// ===================================

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  Target,
  TrendingUp,
  Search,
  FileText,
  Globe,
  Users,
  BarChart3,
  Settings,
  Play,
  RefreshCw,
  Download,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Clock,
  Gauge
} from 'lucide-react';

// ===================================
// INTERFACES
// ===================================

interface OptimizationTool {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'technical' | 'performance' | 'keywords';
  status: 'active' | 'inactive' | 'running';
  lastRun?: Date;
  results?: {
    score: number;
    improvements: number;
    issues: number;
  };
}

interface OptimizationResult {
  id: string;
  toolName: string;
  url: string;
  category: string;
  score: number;
  improvements: string[];
  issues: string[];
  timestamp: Date;
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  variants: {
    name: string;
    traffic: number;
    conversions: number;
    conversionRate: number;
  }[];
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function SEOOptimizationDashboard() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [tools, setTools] = useState<OptimizationTool[]>([]);
  const [recentResults, setRecentResults] = useState<OptimizationResult[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [activeTab, setActiveTab] = useState('tools');

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadOptimizationData();
  }, []);

  // ===================================
  // FUNCIONES
  // ===================================

  const loadOptimizationData = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTools: OptimizationTool[] = [
        {
          id: 'content-optimizer',
          name: 'Content Optimizer',
          description: 'Optimiza contenido para keywords y legibilidad',
          category: 'content',
          status: 'active',
          lastRun: new Date(Date.now() - 3600000),
          results: { score: 85, improvements: 12, issues: 3 }
        },
        {
          id: 'technical-audit',
          name: 'Technical SEO Audit',
          description: 'Auditoría técnica completa de SEO',
          category: 'technical',
          status: 'active',
          lastRun: new Date(Date.now() - 7200000),
          results: { score: 78, improvements: 8, issues: 5 }
        },
        {
          id: 'performance-optimizer',
          name: 'Performance Optimizer',
          description: 'Optimización de Core Web Vitals',
          category: 'performance',
          status: 'running',
          lastRun: new Date()
        },
        {
          id: 'keyword-research',
          name: 'Keyword Research',
          description: 'Investigación y análisis de keywords',
          category: 'keywords',
          status: 'active',
          lastRun: new Date(Date.now() - 86400000),
          results: { score: 92, improvements: 15, issues: 1 }
        }
      ];

      const mockResults: OptimizationResult[] = [
        {
          id: 'result_1',
          toolName: 'Content Optimizer',
          url: '/products/pintura-interior',
          category: 'content',
          score: 85,
          improvements: [
            'Optimizar densidad de keywords',
            'Mejorar estructura de headings',
            'Agregar texto alternativo a imágenes'
          ],
          issues: [
            'Título demasiado largo',
            'Meta description faltante'
          ],
          timestamp: new Date()
        },
        {
          id: 'result_2',
          toolName: 'Technical SEO Audit',
          url: '/categories/pinturas',
          category: 'technical',
          score: 78,
          improvements: [
            'Implementar structured data',
            'Optimizar tiempo de carga',
            'Mejorar enlaces internos'
          ],
          issues: [
            'Canonical tag duplicado',
            'Robots.txt mal configurado'
          ],
          timestamp: new Date(Date.now() - 1800000)
        }
      ];

      const mockABTests: ABTest[] = [
        {
          id: 'ab_1',
          name: 'Title Tag Optimization',
          status: 'running',
          startDate: new Date(Date.now() - 604800000),
          variants: [
            { name: 'Original', traffic: 50, conversions: 45, conversionRate: 3.2 },
            { name: 'Optimized', traffic: 50, conversions: 58, conversionRate: 4.1 }
          ]
        },
        {
          id: 'ab_2',
          name: 'Meta Description Test',
          status: 'completed',
          startDate: new Date(Date.now() - 1209600000),
          endDate: new Date(Date.now() - 604800000),
          variants: [
            { name: 'Control', traffic: 50, conversions: 120, conversionRate: 2.8 },
            { name: 'Variant A', traffic: 50, conversions: 145, conversionRate: 3.4 }
          ]
        }
      ];

      setTools(mockTools);
      setRecentResults(mockResults);
      setAbTests(mockABTests);
    } catch (error) {
      console.error('Error loading optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runOptimizationTool = async (toolId: string) => {
    try {
      setRunning(true);
      
      // Actualizar estado de la herramienta
      setTools(prev => prev.map(tool => 
        tool.id === toolId 
          ? { ...tool, status: 'running' as const, lastRun: new Date() }
          : tool
      ));
      
      // Simular ejecución
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Actualizar con resultados
      setTools(prev => prev.map(tool => 
        tool.id === toolId 
          ? { 
              ...tool, 
              status: 'active' as const,
              results: {
                score: Math.floor(Math.random() * 30) + 70,
                improvements: Math.floor(Math.random() * 10) + 5,
                issues: Math.floor(Math.random() * 5) + 1
              }
            }
          : tool
      ));
      
    } catch (error) {
      console.error('Error running optimization tool:', error);
    } finally {
      setRunning(false);
    }
  };

  const getCategoryIcon = (category: OptimizationTool['category']) => {
    switch (category) {
      case 'content':
        return <FileText className="h-5 w-5" />;
      case 'technical':
        return <Settings className="h-5 w-5" />;
      case 'performance':
        return <Gauge className="h-5 w-5" />;
      case 'keywords':
        return <Search className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: OptimizationTool['category']) => {
    switch (category) {
      case 'content':
        return 'bg-blue-500';
      case 'technical':
        return 'bg-green-500';
      case 'performance':
        return 'bg-purple-500';
      case 'keywords':
        return 'bg-orange-500';
    }
  };

  const getStatusBadge = (status: OptimizationTool['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Ejecutando</Badge>;
    }
  };

  // ===================================
  // RENDER
  // ===================================

  if (loading) {
    return (
      <AdminLayout 
        title="SEO Optimization" 
        breadcrumbs={[
          { label: 'Admin', href: '/admin' }, 
          { label: 'SEO Dashboard', href: '/admin/seo' }, 
          { label: 'Optimization' }
        ]}
      >
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
      title="SEO Optimization Tools" 
      breadcrumbs={[
        { label: 'Admin', href: '/admin' }, 
        { label: 'SEO Dashboard', href: '/admin/seo' }, 
        { label: 'Optimization' }
      ]}
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadOptimizationData}
            disabled={running}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
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
        {/* Métricas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Herramientas Activas</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tools.filter(t => t.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500">de {tools.length} disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(tools.reduce((acc, tool) => acc + (tool.results?.score || 0), 0) / tools.length)}
              </div>
              <p className="text-xs text-gray-500">Optimización general</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejoras Aplicadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tools.reduce((acc, tool) => acc + (tool.results?.improvements || 0), 0)}
              </div>
              <p className="text-xs text-gray-500">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A/B Tests Activos</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {abTests.filter(test => test.status === 'running').length}
              </div>
              <p className="text-xs text-gray-500">Tests en ejecución</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Contenido */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Herramientas de Optimización</CardTitle>
                <CardDescription>
                  Suite completa de herramientas para optimización SEO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tools.map((tool) => (
                    <Card key={tool.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${getCategoryColor(tool.category)} text-white`}>
                            {getCategoryIcon(tool.category)}
                          </div>
                          {getStatusBadge(tool.status)}
                        </div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {tool.results && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Score:</span>
                              <div className="font-semibold">{tool.results.score}/100</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Mejoras:</span>
                              <div className="font-semibold text-green-600">{tool.results.improvements}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Issues:</span>
                              <div className="font-semibold text-red-600">{tool.results.issues}</div>
                            </div>
                          </div>
                        )}
                        
                        {tool.lastRun && (
                          <p className="text-xs text-gray-500">
                            Última ejecución: {tool.lastRun.toLocaleString()}
                          </p>
                        )}

                        <Button 
                          className="w-full"
                          onClick={() => runOptimizationTool(tool.id)}
                          disabled={tool.status === 'running' || running}
                        >
                          {tool.status === 'running' ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Ejecutando...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Ejecutar
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultados Recientes</CardTitle>
                <CardDescription>
                  Últimos resultados de optimización con recomendaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{result.toolName}</h4>
                          <p className="text-sm text-gray-500">{result.url}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{result.score}/100</div>
                          <Badge variant="outline">{result.category}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Mejoras Sugeridas ({result.improvements.length})
                          </h5>
                          <ul className="space-y-1">
                            {result.improvements.map((improvement, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Issues Detectados ({result.issues.length})
                          </h5>
                          <ul className="space-y-1">
                            {result.issues.map((issue, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-500">
                          Analizado el {result.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ab-testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>A/B Testing SEO</CardTitle>
                <CardDescription>
                  Tests de optimización en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {abTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{test.name}</h4>
                          <p className="text-sm text-gray-500">
                            Iniciado: {test.startDate.toLocaleDateString()}
                            {test.endDate && ` - Finalizado: ${test.endDate.toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge className={
                          test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          test.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {test.status === 'running' ? 'En ejecución' :
                           test.status === 'completed' ? 'Completado' : 'Pausado'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.variants.map((variant, index) => (
                          <div key={index} className="border rounded p-3">
                            <h5 className="font-medium mb-2">{variant.name}</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Tráfico:</span>
                                <span className="font-semibold">{variant.traffic}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Conversiones:</span>
                                <span className="font-semibold">{variant.conversions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tasa de conversión:</span>
                                <span className="font-semibold">{variant.conversionRate}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {test.status === 'running' && (
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            Pausar Test
                          </Button>
                          <Button variant="outline" size="sm">
                            Finalizar Test
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Crear Nuevo A/B Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Optimización</CardTitle>
                <CardDescription>
                  Ajustes generales para las herramientas de optimización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Optimización Automática</h4>
                      <p className="text-sm text-gray-500">Ejecutar optimizaciones automáticamente</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">A/B Testing Automático</h4>
                      <p className="text-sm text-gray-500">Crear tests A/B automáticamente</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notificaciones</h4>
                      <p className="text-sm text-gray-500">Recibir alertas de optimización</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Frecuencia de Auditorías</label>
                    <Select>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccionar frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diaria</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">URLs Prioritarias</label>
                    <Textarea 
                      placeholder="Una URL por línea..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>

                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}









