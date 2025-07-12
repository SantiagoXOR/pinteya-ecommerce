"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, ChevronDown, Layers, Zap, AlertTriangle } from 'lucide-react';

export default function TestZIndexPage() {
  const [showNotification, setShowNotification] = useState(false);

  const showTestNotification = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Prueba de Jerarquía Z-Index
        </h1>
        
        <div className="space-y-6">
          {/* Información de la jerarquía */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                Nueva Jerarquía de Z-Index Implementada
              </CardTitle>
              <CardDescription>
                Jerarquía estandarizada para evitar conflictos de superposición
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800">Navegación</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>TopBar</span>
                      <Badge variant="outline">1000</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Header</span>
                      <Badge variant="outline">1100</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Bottom Nav</span>
                      <Badge variant="outline">1300</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800">Overlays</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Dropdown</span>
                      <Badge variant="outline">2000</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Popover</span>
                      <Badge variant="outline">2500</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tooltip</span>
                      <Badge variant="outline">3000</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800">Modales</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Backdrop</span>
                      <Badge variant="outline">5000</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Modal</span>
                      <Badge variant="outline">5100</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Quick View</span>
                      <Badge variant="outline">5400</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800">Críticos</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Notification</span>
                      <Badge variant="outline">8000</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gallery</span>
                      <Badge variant="outline">10000</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pruebas interactivas */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dropdown Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dropdown Test</CardTitle>
                <CardDescription>
                  Debe aparecer por encima del header sticky
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Abrir Dropdown
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Opción 1
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Zap className="w-4 h-4 mr-2" />
                      Opción 2
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Opción 3
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-gray-500 mt-2">
                  Z-index: 2000 (z-dropdown)
                </p>
              </CardContent>
            </Card>

            {/* Modal Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modal Test</CardTitle>
                <CardDescription>
                  Debe aparecer por encima de todo el contenido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      Abrir Modal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modal de Prueba</DialogTitle>
                      <DialogDescription>
                        Este modal debe aparecer por encima del header sticky.
                        Z-index: 5100 (z-modal)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-gray-600">
                        Si puedes ver este modal completamente sin que el header lo tape,
                        la jerarquía de z-index está funcionando correctamente.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-gray-500 mt-2">
                  Z-index: 5100 (z-modal)
                </p>
              </CardContent>
            </Card>

            {/* Alert Dialog Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alert Dialog Test</CardTitle>
                <CardDescription>
                  Debe tener la máxima prioridad visual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Abrir Alert
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Este alert dialog debe aparecer por encima de todos los elementos,
                        incluyendo el header sticky. Z-index: 5200 (z-dialog)
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction>Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-gray-500 mt-2">
                  Z-index: 5200 (z-dialog)
                </p>
              </CardContent>
            </Card>

            {/* Notification Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Test</CardTitle>
                <CardDescription>
                  Debe aparecer por encima de modales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={showTestNotification} className="w-full">
                  Mostrar Notificación
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Z-index: 8000 (z-notification)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Instrucciones de prueba */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de Prueba</CardTitle>
              <CardDescription>
                Cómo verificar que la jerarquía de z-index funciona correctamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Pruebas a realizar:
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Haz scroll para activar el header sticky</li>
                    <li>Abre el dropdown - debe aparecer por encima del header</li>
                    <li>Abre el modal - debe cubrir todo el contenido incluyendo el header</li>
                    <li>Abre el alert dialog - debe tener máxima prioridad</li>
                    <li>Muestra la notificación - debe aparecer por encima de todo</li>
                    <li>Verifica en mobile que la navegación inferior funcione</li>
                  </ol>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Resultados esperados:
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                    <li>Header sticky visible pero no interfiere con elementos interactivos</li>
                    <li>Dropdowns aparecen completamente visibles</li>
                    <li>Modales cubren todo el contenido</li>
                    <li>Notificaciones tienen máxima prioridad</li>
                    <li>No hay elementos cortados o parcialmente ocultos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notificación de prueba */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-notification animate-slide-in-right">
            <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">¡Notificación de prueba!</span>
              </div>
              <p className="text-sm mt-1 opacity-90">
                Esta notificación debe aparecer por encima de todos los elementos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
