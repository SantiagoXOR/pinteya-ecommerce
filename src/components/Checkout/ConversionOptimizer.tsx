// ===================================
// PINTEYA E-COMMERCE - CONVERSION OPTIMIZER
// ===================================

"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Users, 
  Star, 
  Zap, 
  Gift, 
  Shield, 
  Truck,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  Heart
} from "lucide-react";

// Componente de Timer de Urgencia Avanzado
interface UrgencyTimerProps {
  initialMinutes?: number;
  message?: string;
  variant?: 'warning' | 'danger' | 'success';
  showProgress?: boolean;
}

export const UrgencyTimer: React.FC<UrgencyTimerProps> = ({
  initialMinutes = 15,
  message = "Completa tu compra para mantener el precio",
  variant = 'warning',
  showProgress = true
}) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        const newTime = prev - 1;
        setIsUrgent(newTime <= 300); // Últimos 5 minutos
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercentage = ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'from-red-50 to-orange-50 border-red-200 text-red-800';
      case 'success':
        return 'from-green-50 to-emerald-50 border-green-200 text-green-800';
      default:
        return 'from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <Card className={`bg-gradient-to-r ${getVariantStyles()} ${isUrgent ? 'animate-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUrgent ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-red-600' : 'text-yellow-600'} ${
              isUrgent ? 'animate-pulse' : ''
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              {isUrgent && <Badge variant="destructive" className="animate-bounce">¡URGENTE!</Badge>}
            </div>
            <p className="text-sm">{message}</p>
            {showProgress && (
              <div className="mt-2 w-full bg-white/50 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isUrgent ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Indicador de Stock Dinámico
interface StockIndicatorProps {
  quantity: number;
  lowStockThreshold?: number;
  viewers?: number;
  recentPurchases?: number;
  showSocialProof?: boolean;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  quantity,
  lowStockThreshold = 5,
  viewers = 0,
  recentPurchases = 0,
  showSocialProof = true
}) => {
  const [currentViewers, setCurrentViewers] = useState(viewers);
  const isLowStock = quantity <= lowStockThreshold;
  const isCriticalStock = quantity <= 2;

  // Simular viewers dinámicos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentViewers(prev => {
        const change = Math.floor(Math.random() * 6) - 2; // -2 a +3
        return Math.max(1, Math.min(50, prev + change));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getStockColor = () => {
    if (isCriticalStock) return 'red';
    if (isLowStock) return 'yellow';
    return 'green';
  };

  const stockColor = getStockColor();

  return (
    <div className="space-y-3">
      {/* Stock Principal */}
      <Card className={`bg-gradient-to-r ${
        stockColor === 'red' ? 'from-red-50 to-orange-50 border-red-200' :
        stockColor === 'yellow' ? 'from-yellow-50 to-orange-50 border-yellow-200' :
        'from-green-50 to-emerald-50 border-green-200'
      } ${isCriticalStock ? 'animate-pulse' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${
                stockColor === 'red' ? 'text-red-600' :
                stockColor === 'yellow' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
              <span className={`font-medium ${
                stockColor === 'red' ? 'text-red-800' :
                stockColor === 'yellow' ? 'text-yellow-800' :
                'text-green-800'
              }`}>
                {isCriticalStock ? '¡ÚLTIMAS UNIDADES!' : 
                 isLowStock ? `Solo quedan ${quantity} unidades` :
                 `${quantity} unidades disponibles`}
              </span>
            </div>
            {isCriticalStock && (
              <Badge variant="destructive" className="animate-bounce">
                CRÍTICO
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      {showSocialProof && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentViewers > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {currentViewers} personas viendo
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {recentPurchases > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {recentPurchases} compras hoy
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de Trust Signals Avanzado
export const TrustSignals: React.FC = () => {
  const trustItems = [
    {
      icon: Shield,
      title: "Pago 100% Seguro",
      description: "SSL + PCI DSS",
      color: "green"
    },
    {
      icon: Truck,
      title: "Envío Gratis",
      description: "En compras +$15.000",
      color: "blue"
    },
    {
      icon: Gift,
      title: "12 Cuotas",
      description: "Sin interés",
      color: "purple"
    },
    {
      icon: Star,
      title: "4.8/5 ⭐",
      description: "1,247 reviews",
      color: "yellow"
    },
    {
      icon: CheckCircle,
      title: "Garantía",
      description: "Color exacto",
      color: "emerald"
    },
    {
      icon: Heart,
      title: "Satisfacción",
      description: "98% clientes felices",
      color: "pink"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {trustItems.map((item, index) => (
        <Card key={index} className={`bg-${item.color}-50 border-${item.color}-200 hover:shadow-md transition-shadow`}>
          <CardContent className="p-3 text-center">
            <item.icon className={`w-5 h-5 text-${item.color}-600 mx-auto mb-2`} />
            <p className={`font-medium text-${item.color}-800 text-sm`}>{item.title}</p>
            <p className={`text-xs text-${item.color}-700 mt-1`}>{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Componente de Social Proof
interface SocialProofProps {
  recentPurchases?: Array<{
    name: string;
    product: string;
    time: string;
    location: string;
  }>;
  showTestimonials?: boolean;
}

export const SocialProof: React.FC<SocialProofProps> = ({
  recentPurchases = [],
  showTestimonials = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const defaultPurchases = [
    { name: "Juan C.", product: "Pintura Sherwin Williams", time: "hace 2 min", location: "Córdoba" },
    { name: "María L.", product: "Esmalte Petrilac", time: "hace 5 min", location: "Buenos Aires" },
    { name: "Carlos R.", product: "Pintura Sinteplast", time: "hace 8 min", location: "Rosario" },
    { name: "Ana M.", product: "Pintura Plavicon", time: "hace 12 min", location: "Mendoza" },
  ];

  const purchases = recentPurchases.length > 0 ? recentPurchases : defaultPurchases;

  const testimonials = [
    {
      text: "Excelente calidad, llegó en 24hs tal como prometieron",
      author: "Roberto M.",
      rating: 5,
      verified: true
    },
    {
      text: "El color quedó exactamente como esperaba, muy recomendable",
      author: "Laura S.",
      rating: 5,
      verified: true
    },
    {
      text: "Mejor precio que en otras tiendas y envío súper rápido",
      author: "Diego F.",
      rating: 5,
      verified: true
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % purchases.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [purchases.length]);

  return (
    <div className="space-y-4">
      {/* Compras Recientes */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-800">
                {purchases[currentIndex].name} compró {purchases[currentIndex].product}
              </p>
              <p className="text-sm text-blue-700">
                {purchases[currentIndex].time} • {purchases[currentIndex].location}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonios */}
      {showTestimonials && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm text-yellow-800 italic">
                  "{testimonials[currentIndex % testimonials.length].text}"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm font-medium text-yellow-800">
                    {testimonials[currentIndex % testimonials.length].author}
                  </p>
                  {testimonials[currentIndex % testimonials.length].verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente de Incentivos de Compra
export const PurchaseIncentives: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          ¡Beneficios Exclusivos!
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Envío GRATIS en compras +$15.000</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">12 cuotas sin interés con MercadoPago</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">5% descuento pagando en efectivo</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Garantía de color exacto o devolución</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Exit Intent
interface ExitIntentProps {
  onClose: () => void;
  onAccept: () => void;
  discount?: number;
}

export const ExitIntentModal: React.FC<ExitIntentProps> = ({
  onClose,
  onAccept,
  discount = 10
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            ¡Espera! No te vayas sin tu descuento
          </h2>
          <p className="text-red-700 mb-4">
            Te ofrecemos un {discount}% de descuento exclusivo si completas tu compra ahora
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onAccept}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              ¡Quiero mi descuento!
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              No, gracias
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
