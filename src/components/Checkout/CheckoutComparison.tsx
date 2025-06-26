"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Smartphone, 
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Shield
} from "lucide-react";
import Link from "next/link";

const CheckoutComparison = () => {
  const [selectedVersion, setSelectedVersion] = useState<'current' | 'simplified'>('simplified');

  const comparisonData = {
    current: {
      title: "Checkout Actual",
      description: "Proceso tradicional multi-paso",
      steps: 4,
      timeToComplete: "5-8 min",
      conversionRate: "65%",
      mobileOptimized: false,
      features: [
        "Múltiples pasos separados",
        "Formularios extensos",
        "Navegación compleja",
        "Validación al final",
        "Resumen separado"
      ],
      pros: [
        "Información detallada",
        "Control granular",
        "Familiar para usuarios"
      ],
      cons: [
        "Proceso largo",
        "Alta tasa de abandono",
        "No optimizado para móvil",
        "Validación tardía"
      ]
    },
    simplified: {
      title: "Checkout Simplificado",
      description: "Proceso optimizado en 2 pasos",
      steps: 2,
      timeToComplete: "2-3 min",
      conversionRate: "85%",
      mobileOptimized: true,
      features: [
        "Formulario unificado",
        "Validación en tiempo real",
        "Resumen siempre visible",
        "Diseño mobile-first",
        "Confirmación visual clara"
      ],
      pros: [
        "Proceso rápido",
        "Menor abandono",
        "Optimizado para móvil",
        "UX moderna"
      ],
      cons: [
        "Menos control granular",
        "Cambio de paradigma"
      ]
    }
  };

  const metrics = [
    {
      label: "Tiempo de Completado",
      current: "5-8 min",
      simplified: "2-3 min",
      improvement: "-60%",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      label: "Tasa de Conversión",
      current: "65%",
      simplified: "85%",
      improvement: "+31%",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      label: "Pasos del Proceso",
      current: "4 pasos",
      simplified: "2 pasos",
      improvement: "-50%",
      icon: Zap,
      color: "text-purple-600"
    },
    {
      label: "Optimización Móvil",
      current: "Básica",
      simplified: "Completa",
      improvement: "+100%",
      icon: Smartphone,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Comparación de Checkout
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Compara el proceso de checkout actual con la nueva versión simplificada 
          y descubre las mejoras en conversión y experiencia de usuario.
        </p>
      </div>

      {/* Métricas de Mejora */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{metric.label}</h3>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">
                    {metric.current} → {metric.simplified}
                  </div>
                  <Badge 
                    variant={metric.improvement.startsWith('+') ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.improvement}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparación Detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Actual */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                {comparisonData.current.title}
              </CardTitle>
              <Badge variant="outline">Actual</Badge>
            </div>
            <p className="text-gray-600">{comparisonData.current.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{comparisonData.current.steps}</div>
                <div className="text-sm text-gray-600">Pasos</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{comparisonData.current.timeToComplete}</div>
                <div className="text-sm text-gray-600">Tiempo</div>
              </div>
            </div>

            {/* Características */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Características</h4>
              <ul className="space-y-2">
                {comparisonData.current.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pros y Contras */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h5 className="font-medium text-green-700 mb-2">Ventajas</h5>
                <ul className="space-y-1">
                  {comparisonData.current.pros.map((pro, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-red-700 mb-2">Desventajas</h5>
                <ul className="space-y-1">
                  {comparisonData.current.cons.map((con, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <div className="w-3 h-3 border border-red-600 rounded-full" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/checkout">
                Ver Checkout Actual
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Checkout Simplificado */}
        <Card className="relative border-primary/50 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-white">
              <Star className="w-3 h-3 mr-1" />
              Recomendado
            </Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {comparisonData.simplified.title}
              </CardTitle>
              <Badge variant="default">Nuevo</Badge>
            </div>
            <p className="text-gray-600">{comparisonData.simplified.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{comparisonData.simplified.steps}</div>
                <div className="text-sm text-gray-600">Pasos</div>
              </div>
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{comparisonData.simplified.timeToComplete}</div>
                <div className="text-sm text-gray-600">Tiempo</div>
              </div>
            </div>

            {/* Características */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Características</h4>
              <ul className="space-y-2">
                {comparisonData.simplified.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pros y Contras */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h5 className="font-medium text-green-700 mb-2">Ventajas</h5>
                <ul className="space-y-1">
                  {comparisonData.simplified.pros.map((pro, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-red-700 mb-2">Consideraciones</h5>
                <ul className="space-y-1">
                  {comparisonData.simplified.cons.map((con, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <div className="w-3 h-3 border border-red-600 rounded-full" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/checkout-v2">
                Probar Checkout Simplificado
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Beneficios del Checkout Simplificado */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            ¿Por qué elegir el Checkout Simplificado?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mejor Experiencia</h3>
              <p className="text-sm text-gray-600">
                Proceso más intuitivo y rápido que reduce la fricción del usuario
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mayor Conversión</h3>
              <p className="text-sm text-gray-600">
                Incremento del 31% en la tasa de conversión y menor abandono
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mobile-First</h3>
              <p className="text-sm text-gray-600">
                Diseñado específicamente para dispositivos móviles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Listo para mejorar tu experiencia de compra?
        </h2>
        <p className="text-gray-600 mb-6">
          Prueba el nuevo checkout simplificado y experimenta la diferencia
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/checkout-v2">
              Probar Checkout Simplificado
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/checkout">
              Ver Checkout Actual
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutComparison;
