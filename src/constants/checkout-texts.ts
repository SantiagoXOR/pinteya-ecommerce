/**
 * Constantes de textos para el flujo de checkout
 * Centraliza todos los textos para facilitar mantenimiento y futuras traducciones
 */

export const CHECKOUT_TEXTS = {
  contact: {
    title: 'Ingresá tus datos para que sepamos a quién entregarle el pedido.',
    fields: {
      firstName: 'Nombre',
      lastName: 'Apellido',
      phone: 'Teléfono',
    },
  },
  shipping: {
    title: '¿A dónde te llevamos tus pinturas?',
    placeholder: 'Calle y número (ej: Manuel Dorrego 1680)',
    fields: {
      streetAddress: 'Dirección',
      apartment: 'Departamento / Piso / Unidad (opcional)',
      observations: 'Observaciones (opcional)',
    },
  },
  payment: {
    title: 'Elegí cómo querés pagar tu pedido de forma segura.',
    methods: {
      cashOnDelivery: {
        title: 'Pagás al recibir tu pedido',
        description: 'Comodidad y seguridad en tu puerta',
      },
      mercadoPago: {
        title: 'Mercado Pago',
        description: 'Pagá online en cuotas. Tarjetas de crédito, débito o dinero en cuenta.',
      },
    },
  },
  confirmation: {
    title: '¡Ya casi es tuyo!',
    body: 'Dale un último vistazo a los detalles antes de finalizar la compra.',
    button: 'Confirmar Pedido',
  },
  summary: {
    button: 'Comprar ahora',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    shippingFree: 'Gratis',
    total: 'Total',
  },
} as const

