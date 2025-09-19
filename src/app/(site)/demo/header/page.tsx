"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TopBar from '@/components/Header/TopBar';
import EnhancedSearchBar from '@/components/Header/EnhancedSearchBar';
import ActionButtons from '@/components/Header/ActionButtons';
import DropdownTester from '@/components/Header/DropdownTester';
import { CheckCircle, AlertCircle, Info, Smartphone, Monitor, Tablet } from 'lucide-react';

const HeaderDemoPage = () => {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const handleSearch = (query: string, category?: string) => {
    setSearchResults([
      `Resultado para "${query}" en categoría ${category}`,
      'Látex Interior Premium 20L',
      'Esmalte Sintético Brillante',
      'Pincel Profesional Set'
    ]);
  };

  const deviceClasses = {
    mobile: 'max-w-sm mx-auto',
    tablet: 'max-w-2xl mx-auto',
    desktop: 'max-w-full'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de la página */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Demo: Header Mejorado Pinteya
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Demostración interactiva del header mejorado con estructura de 3 niveles, 
            dropdowns funcionales y diseño responsive.
          </p>
        </div>

        {/* Estado del sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-4">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="font-semibold text-green-700">Dropdown Menu</p>
                <p className="text-sm text-gray-600">Componente instalado</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="font-semibold text-green-700">Responsive Design</p>
                <p className="text-sm text-gray-600">Mobile-first implementado</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="font-semibold text-green-700">Microinteracciones</p>
                <p className="text-sm text-gray-600">Animaciones activas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selector de dispositivo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Vista Responsive
            </CardTitle>
            <CardDescription>
              Selecciona el tipo de dispositivo para ver cómo se adapta el header
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant={selectedDevice === 'mobile' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('mobile')}
                className="flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </Button>
              <Button
                variant={selectedDevice === 'tablet' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('tablet')}
                className="flex items-center gap-2"
              >
                <Tablet className="w-4 h-4" />
                Tablet
              </Button>
              <Button
                variant={selectedDevice === 'desktop' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('desktop')}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </Button>
            </div>
            
            <Badge variant="outline" className="mb-4">
              Vista actual: {selectedDevice}
            </Badge>
          </CardContent>
        </Card>

        {/* Demo de componentes */}
        <Tabs defaultValue="topbar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="topbar">TopBar</TabsTrigger>
            <TabsTrigger value="search">Búsqueda</TabsTrigger>
            <TabsTrigger value="actions">Acciones</TabsTrigger>
            <TabsTrigger value="complete">Completo</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          {/* TopBar Demo */}
          <TabsContent value="topbar">
            <Card>
              <CardHeader>
                <CardTitle>TopBar - Información Superior</CardTitle>
                <CardDescription>
                  Barra superior con información de contacto y selector de zona de entrega
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg overflow-hidden ${deviceClasses[selectedDevice]}`}>
                  <TopBar />
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Funcionalidades:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Teléfono clickeable para llamadas directas</li>
                    <li>• Horarios de atención claramente visibles</li>
                    <li>• Selector de zona de entrega con dropdown</li>
                    <li>• Indicador de asesoramiento 24/7</li>
                    <li>• Oculto automáticamente en mobile</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Demo */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Buscador Mejorado</CardTitle>
                <CardDescription>
                  Buscador prominente con selector de categorías y placeholders dinámicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg p-4 bg-white ${deviceClasses[selectedDevice]}`}>
                  <EnhancedSearchBar 
                    onSearch={handleSearch}
                    size={selectedDevice === 'mobile' ? 'sm' : 'md'}
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Resultados de búsqueda:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      {searchResults.map((result, index) => (
                        <li key={index}>• {result}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Características:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Selector de categorías con iconos</li>
                    <li>• Placeholder dinámico según categoría</li>
                    <li>• Botón de búsqueda prominente en naranja Pinteya</li>
                    <li>• Sugerencias rápidas en desktop</li>
                    <li>• Responsive con tamaños adaptativos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Demo */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Botones de Acción</CardTitle>
                <CardDescription>
                  Autenticación, carrito y wishlist con dropdowns interactivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg p-4 bg-white ${deviceClasses[selectedDevice]}`}>
                  <ActionButtons 
                    variant={selectedDevice === 'mobile' ? 'mobile' : 'header'} 
                  />
                </div>
                
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Funcionalidades:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Botón de Google Sign In con ícono</li>
                    <li>• Carrito con badge de cantidad animado</li>
                    <li>• Wishlist (oculto en mobile)</li>
                    <li>• Dropdown de usuario autenticado</li>
                    <li>• Variantes mobile y desktop</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complete Demo */}
          <TabsContent value="complete">
            <Card>
              <CardHeader>
                <CardTitle>Header Completo</CardTitle>
                <CardDescription>
                  Vista completa del header con todos los componentes integrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg overflow-hidden bg-white ${deviceClasses[selectedDevice]}`}>
                  {/* Simulación del header completo */}
                  <div className="space-y-0">
                    {selectedDevice !== 'mobile' && <TopBar />}
                    <div className="p-4 bg-white border-b">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-shrink-0">
                          <img 
                            src="/images/logo/LOGO POSITIVO.svg" 
                            alt="Pinteya Logo" 
                            className="h-8 w-auto"
                          />
                        </div>
                        {selectedDevice !== 'mobile' && (
                          <div className="flex-1 max-w-2xl">
                            <EnhancedSearchBar 
                              onSearch={handleSearch}
                              size="sm"
                            />
                          </div>
                        )}
                        <div className="flex-shrink-0">
                          <ActionButtons 
                            variant={selectedDevice === 'mobile' ? 'mobile' : 'header'} 
                          />
                        </div>
                      </div>
                      {selectedDevice === 'mobile' && (
                        <div className="mt-4">
                          <EnhancedSearchBar 
                            onSearch={handleSearch}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Estructura de 3 Niveles:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>Nivel 1:</strong> TopBar con información de contacto (solo desktop)</li>
                        <li><strong>Nivel 2:</strong> Header principal con logo, búsqueda y acciones</li>
                        <li><strong>Nivel 3:</strong> Navegación integrada (responsive)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle>Testing Interactivo</CardTitle>
                <CardDescription>
                  Herramientas para validar la funcionalidad de los dropdowns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownTester />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer de la demo */}
        <div className="mt-8 text-center text-gray-500">
          <p>Demo del Header Mejorado - Pinteya E-commerce</p>
          <p className="text-sm">Todos los dropdowns están completamente funcionales</p>
        </div>
      </div>
    </div>
  );
};

export default HeaderDemoPage;









