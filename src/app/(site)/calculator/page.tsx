import { Metadata } from "next";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Paintbrush, Home, Ruler } from "lucide-react";

export const metadata: Metadata = {
  title: "Cotizador de Pintura | Pinteya E-commerce",
  description: "Calcula la cantidad exacta de pintura que necesitas para tu proyecto. Cotizador gratuito y fácil de usar.",
  keywords: "cotizador pintura, calculadora pintura, cuanta pintura necesito, presupuesto pintura",
};

export default function CalculatorPage() {
  return (
    <>
      <Breadcrumb title="Cotizador de Pintura" />
      
      <section className="pb-20 pt-10">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cotizador de Pintura
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Calcula la cantidad exacta de pintura que necesitas para tu proyecto. 
              Obtén un presupuesto detallado al instante.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario de Cotización */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Datos del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tipo de Superficie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Superficie
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="">Selecciona el tipo de superficie</option>
                    <option value="interior">Pared Interior</option>
                    <option value="exterior">Pared Exterior</option>
                    <option value="techo">Techo</option>
                    <option value="madera">Madera</option>
                    <option value="metal">Metal</option>
                  </select>
                </div>

                {/* Dimensiones */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ancho (metros)
                    </label>
                    <Input 
                      type="number" 
                      placeholder="ej: 4.5"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alto (metros)
                    </label>
                    <Input 
                      type="number" 
                      placeholder="ej: 2.8"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Número de Manos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Manos
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary" defaultValue="2">
                    <option value="1">1 Mano</option>
                    <option value="2">2 Manos (Recomendado)</option>
                    <option value="3">3 Manos</option>
                  </select>
                </div>

                {/* Tipo de Pintura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pintura
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="">Selecciona el tipo de pintura</option>
                    <option value="latex">Látex Interior</option>
                    <option value="latex-exterior">Látex Exterior</option>
                    <option value="esmalte">Esmalte Sintético</option>
                    <option value="antioxido">Antióxido</option>
                  </select>
                </div>

                <Button className="w-full" size="lg">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular Presupuesto
                </Button>
              </CardContent>
            </Card>

            {/* Resultado y Recomendaciones */}
            <div className="space-y-6">
              {/* Resultado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="w-5 h-5 text-primary" />
                    Resultado del Cálculo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-primary mb-2">
                      12.5 L
                    </div>
                    <p className="text-gray-600 mb-4">
                      Cantidad total de pintura necesaria
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                      <h4 className="font-semibold mb-2">Desglose:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Superficie: 25 m²</li>
                        <li>• Rendimiento: 10 m²/L</li>
                        <li>• 2 manos de pintura</li>
                        <li>• + 10% desperdicio</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Productos Recomendados */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos Recomendados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                      <div className="flex-1">
                        <h4 className="font-medium">Sherwin Williams Látex</h4>
                        <p className="text-sm text-gray-600">Balde 20L - Rinde 200m²</p>
                        <p className="text-primary font-semibold">$15.500</p>
                      </div>
                      <Button size="sm">Agregar</Button>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                      <div className="flex-1">
                        <h4 className="font-medium">Rodillo Premium</h4>
                        <p className="text-sm text-gray-600">Incluye bandeja</p>
                        <p className="text-primary font-semibold">$2.500</p>
                      </div>
                      <Button size="sm">Agregar</Button>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold">Total estimado:</span>
                      <span className="text-xl font-bold text-primary">$18.000</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      Ver Presupuesto Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tips y Consejos */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Tips para tu Proyecto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Home className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Preparación</h3>
                  <p className="text-sm text-gray-600">
                    Limpia y lija la superficie antes de pintar para mejores resultados.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Paintbrush className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Aplicación</h3>
                  <p className="text-sm text-gray-600">
                    Aplica capas delgadas y uniformes para un acabado profesional.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Calculator className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Cantidad</h3>
                  <p className="text-sm text-gray-600">
                    Siempre compra un 10% extra para retoques y desperdicio.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
