'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { processMockPayment, generateTestCardData } from '@/lib/integrations/mercadopago/mercadopago-mock';

export default function MockMercadoPagoCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    document: '',
  });

  const preferenceId = searchParams.get('preference_id');
  const isSandbox = searchParams.get('sandbox') === 'true';

  useEffect(() => {
    if (!preferenceId) {
      router.push('/');
    }
  }, [preferenceId, router]);

  const handleUseTestCard = () => {
    const testCard = generateTestCardData();
    setCardData({
      cardNumber: testCard.number,
      cardName: testCard.name,
      expiryDate: testCard.expiry,
      cvv: testCard.cvv,
      document: testCard.document,
    });
  };

  const handleProcessPayment = async () => {
    if (!preferenceId) {return;}

    setIsProcessing(true);

    try {
      // Simular procesamiento
      const result = await processMockPayment(preferenceId, cardData);
      
      // Redirigir según el resultado
      setTimeout(() => {
        window.location.href = result.redirect_url;
      }, 2000);
      
    } catch (error) {
      console.error('Error en pago mock:', error);
      setIsProcessing(false);
    }
  };

  const isFormValid = cardData.cardNumber && cardData.cardName && 
                     cardData.expiryDate && cardData.cvv && cardData.document;

  if (!preferenceId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600">ID de preferencia no válido</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold mb-2">Procesando Pago</h2>
            <p className="text-gray-600 mb-4">Estamos procesando tu pago de forma segura...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Pago 100% Seguro</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/images/logo/mercadopago.svg" alt="MercadoPago" className="h-8" />
            {isSandbox && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                SANDBOX
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Checkout de Prueba - MercadoPago Mock
          </h1>
          <p className="text-gray-600">
            Simulador de MercadoPago para testing local
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Pago */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Datos de la Tarjeta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Botón para usar tarjeta de prueba */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Modo de Prueba
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Usa datos de prueba para simular diferentes resultados
                </p>
                <Button 
                  onClick={handleUseTestCard}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Usar Tarjeta de Prueba
                </Button>
              </div>

              {/* Número de tarjeta */}
              <div>
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.cardNumber}
                  onChange={(e) => setCardData(prev => ({ ...prev, cardNumber: e.target.value }))}
                />
              </div>

              {/* Nombre del titular */}
              <div>
                <Label htmlFor="cardName">Nombre del titular</Label>
                <Input
                  id="cardName"
                  placeholder="JUAN PEREZ"
                  value={cardData.cardName}
                  onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
                />
              </div>

              {/* Vencimiento y CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Vencimiento</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/AA"
                    value={cardData.expiryDate}
                    onChange={(e) => setCardData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
              </div>

              {/* Documento */}
              <div>
                <Label htmlFor="document">DNI</Label>
                <Input
                  id="document"
                  placeholder="12345678"
                  value={cardData.document}
                  onChange={(e) => setCardData(prev => ({ ...prev, document: e.target.value }))}
                />
              </div>

              {/* Botón de pago */}
              <Button 
                onClick={handleProcessPayment}
                disabled={!isFormValid || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isProcessing ? 'Procesando...' : 'Pagar'}
              </Button>
            </CardContent>
          </Card>

          {/* Información del pedido */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Detalles del Pago</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Producto:</span>
                  <span className="font-medium">Poximix Exterior 5kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio:</span>
                  <span className="font-medium">$20.250</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>$20.250</span>
                </div>
              </div>

              {/* Información de testing */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Tarjetas de Prueba
                </h4>
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>Aprobada:</strong> 4509 9535 6623 3704</p>
                  <p><strong>Rechazada:</strong> 4013 5406 8274 6260</p>
                  <p><strong>Titular:</strong> APRO APRO / OTHE OTHE</p>
                  <p><strong>DNI:</strong> 12345678</p>
                  <p><strong>CVV:</strong> 123</p>
                  <p><strong>Vencimiento:</strong> 11/25</p>
                </div>
              </div>

              {/* Información del entorno */}
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Información del Mock</h4>
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>Preference ID:</strong> {preferenceId}</p>
                  <p><strong>Entorno:</strong> {isSandbox ? 'Sandbox' : 'Testing'}</p>
                  <p><strong>Modo:</strong> Simulación Local</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}









