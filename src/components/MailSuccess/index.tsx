// ===================================
// MAIL SUCCESS COMPONENT
// ===================================
// Componente de éxito para confirmación de envío de emails

"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle, Mail, Home, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ===================================
// INTERFACES
// ===================================

interface MailSuccessProps {
  /** Título personalizado */
  title?: string;
  /** Descripción personalizada */
  description?: string;
  /** Email al que se envió */
  email?: string;
  /** Tipo de email enviado */
  type?: 'contact' | 'newsletter' | 'order' | 'general';
  /** Mostrar botón de volver */
  showGoBack?: boolean;
  /** URL de redirección personalizada */
  redirectUrl?: string;
  /** Texto del botón de redirección */
  redirectText?: string;
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

const MailSuccess: React.FC<MailSuccessProps> = ({
  title,
  description,
  email,
  type = 'general',
  showGoBack = true,
  redirectUrl,
  redirectText,
}) => {
  
  // Configuración por defecto basada en el tipo
  const getTypeConfig = (mailType: string) => {
    switch (mailType) {
      case 'contact':
        return {
          title: title || '¡Mensaje enviado correctamente!',
          description: description || 'Recibimos tu consulta y te responderemos a la brevedad. Revisá tu bandeja de entrada para la confirmación.',
          icon: <Mail className="w-16 h-16 text-green-500" />,
          nextSteps: [
            'Te responderemos en las próximas 24 horas',
            'Revisá tu bandeja de entrada y spam',
            'Podés seguir navegando nuestra tienda'
          ],
        };
      case 'newsletter':
        return {
          title: title || '¡Suscripción exitosa!',
          description: description || 'Te suscribiste correctamente a nuestro newsletter. Recibirás las mejores ofertas y novedades.',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          nextSteps: [
            'Recibirás ofertas exclusivas',
            'Novedades de productos',
            'Consejos y tutoriales'
          ],
        };
      case 'order':
        return {
          title: title || '¡Pedido confirmado!',
          description: description || 'Tu pedido fue procesado correctamente. Te enviamos los detalles por email.',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          nextSteps: [
            'Recibirás actualizaciones del envío',
            'Podés rastrear tu pedido',
            'Te contactaremos si necesitamos algo'
          ],
        };
      default:
        return {
          title: title || '¡Email enviado correctamente!',
          description: description || 'Tu email fue enviado exitosamente.',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          nextSteps: [
            'Revisá tu bandeja de entrada',
            'Te responderemos pronto',
            'Gracias por contactarnos'
          ],
        };
    }
  };

  const config = getTypeConfig(type);

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader className="pb-4">
            {/* Icono de éxito */}
            <div className="mx-auto mb-4">
              {config.icon}
            </div>
            
            {/* Título */}
            <CardTitle className="text-2xl text-gray-900">
              {config.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Descripción */}
            <p className="text-gray-600 leading-relaxed">
              {config.description}
            </p>

            {/* Email de confirmación */}
            {email && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Enviado a: {email}
                  </span>
                </div>
              </div>
            )}

            {/* Próximos pasos */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-900 mb-3">
                ¿Qué sigue ahora?
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                {config.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botón principal */}
              {redirectUrl ? (
                <Button asChild className="flex-1 bg-blaze-orange-600 hover:bg-blaze-orange-700">
                  <Link href={redirectUrl}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {redirectText || 'Continuar'}
                  </Link>
                </Button>
              ) : (
                <Button asChild className="flex-1 bg-blaze-orange-600 hover:bg-blaze-orange-700">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Ir al inicio
                  </Link>
                </Button>
              )}

              {/* Botón secundario - Volver */}
              {showGoBack && (
                <Button 
                  variant="outline" 
                  onClick={handleGoBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              )}
            </div>

            {/* Enlaces útiles */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">
                Mientras tanto, podés:
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link 
                  href="/shop" 
                  className="text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors"
                >
                  Ver productos
                </Link>
                <Link 
                  href="/offers" 
                  className="text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors"
                >
                  Ofertas
                </Link>
                <Link 
                  href="/help" 
                  className="text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors"
                >
                  Ayuda
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿No recibiste el email?{' '}
            <Link 
              href="/contact" 
              className="text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors"
            >
              Contactanos
            </Link>
            {' '}y te ayudamos.
          </p>
        </div>
      </div>
    </div>
  );
};

// ===================================
// COMPONENTES ESPECIALIZADOS
// ===================================

const ContactSuccess: React.FC<Omit<MailSuccessProps, 'type'>> = (props) => (
  <MailSuccess {...props} type="contact" />
);

const NewsletterSuccess: React.FC<Omit<MailSuccessProps, 'type'>> = (props) => (
  <MailSuccess {...props} type="newsletter" />
);

const OrderSuccess: React.FC<Omit<MailSuccessProps, 'type'>> = (props) => (
  <MailSuccess {...props} type="order" />
);

// ===================================
// EXPORTS
// ===================================

export type { MailSuccessProps };
export { ContactSuccess, NewsletterSuccess, OrderSuccess };
export default MailSuccess;
