// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN DE EMAIL
// ===================================

import { Resend } from 'resend';
import { emailConfig } from './env-config';

// Inicialización lazy de Resend
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!emailConfig.resendApiKey) {
      throw new Error('RESEND_API_KEY no está configurado');
    }
    resend = new Resend(emailConfig.resendApiKey);
  }
  return resend;
}

// ===================================
// TIPOS DE EMAIL
// ===================================

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export interface OrderConfirmationData {
  userName: string;
  orderNumber: string;
  orderTotal: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
}

export interface PasswordResetData {
  userName: string;
  resetLink: string;
}

// ===================================
// PLANTILLAS DE EMAIL
// ===================================

/**
 * Plantilla de email de bienvenida
 */
export function createWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  return {
    to: data.userEmail,
    subject: '¡Bienvenido a Pinteya! 🎨',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenido a Pinteya</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea5a17; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #fc9d04; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a Pinteya!</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.userName},</h2>
              <p>¡Gracias por unirte a Pinteya! Estamos emocionados de tenerte como parte de nuestra comunidad.</p>
              <p>En Pinteya encontrarás todo lo que necesitas para tus proyectos de pintura:</p>
              <ul>
                <li>🎨 Pinturas de las mejores marcas</li>
                <li>🛠️ Herramientas profesionales</li>
                <li>📦 Envío rápido y seguro</li>
                <li>💬 Asesoramiento especializado</li>
              </ul>
              <a href="https://www.pinteya.com/shop" class="button">Explorar Productos</a>
              <p>Si tienes alguna pregunta, no dudes en contactarnos en <a href="mailto:${emailConfig.supportEmail}">${emailConfig.supportEmail}</a></p>
            </div>
            <div class="footer">
              <p>© 2025 Pinteya. Todos los derechos reservados.</p>
              <p>Córdoba, Argentina</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Bienvenido a Pinteya, ${data.userName}! Gracias por unirte a nuestra comunidad. Visita https://www.pinteya.com/shop para explorar nuestros productos.`
  };
}

/**
 * Plantilla de email de confirmación de pedido
 */
export function createOrderConfirmationEmail(data: OrderConfirmationData): EmailTemplate {
  const itemsHtml = data.orderItems.map(item => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price}</td>
    </tr>`
  ).join('');

  return {
    to: data.userEmail,
    subject: `Confirmación de Pedido #${data.orderNumber} - Pinteya`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmación de Pedido</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea5a17; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-table th { background: #fc9d04; color: white; padding: 12px; text-align: left; }
            .total { font-weight: bold; font-size: 18px; color: #ea5a17; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Pedido Confirmado! ✅</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.userName},</h2>
              <p>Tu pedido <strong>#${data.orderNumber}</strong> ha sido confirmado y está siendo procesado.</p>
              
              <h3>Resumen del Pedido:</h3>
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="2" style="padding: 12px; font-weight: bold;">Total:</td>
                    <td style="padding: 12px; text-align: right;" class="total">${data.orderTotal}</td>
                  </tr>
                </tbody>
              </table>
              
              <p>Recibirás un email con el tracking cuando tu pedido sea enviado.</p>
              <p>Si tienes alguna pregunta, contactanos en <a href="mailto:${emailConfig.supportEmail}">${emailConfig.supportEmail}</a></p>
            </div>
            <div class="footer">
              <p>© 2025 Pinteya. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hola ${data.userName}, tu pedido #${data.orderNumber} por ${data.orderTotal} ha sido confirmado. Recibirás tracking cuando sea enviado.`
  };
}

/**
 * Plantilla de email de recuperación de contraseña
 */
export function createPasswordResetEmail(data: PasswordResetData): EmailTemplate {
  return {
    to: data.userEmail,
    subject: 'Recuperar Contraseña - Pinteya',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Recuperar Contraseña</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea5a17; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #fc9d04; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperar Contraseña</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.userName},</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Pinteya.</p>
              
              <a href="${data.resetLink}" class="button">Restablecer Contraseña</a>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este enlace expira en 10 minutos por seguridad</li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                  <li>Nunca compartas este enlace con nadie</li>
                </ul>
              </div>
              
              <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${data.resetLink}</p>
              
              <p>Si tienes problemas, contactanos en <a href="mailto:${emailConfig.supportEmail}">${emailConfig.supportEmail}</a></p>
            </div>
            <div class="footer">
              <p>© 2025 Pinteya. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hola ${data.userName}, solicita restablecer tu contraseña en Pinteya. Usa este enlace: ${data.resetLink} (expira en 10 minutos)`
  };
}

// ===================================
// FUNCIONES DE ENVÍO
// ===================================

/**
 * Envía un email usando Resend
 */
export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resendClient = getResendClient();

    const result = await resendClient.emails.send({
      from: emailConfig.fromEmail,
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Envía email de bienvenida
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const template = createWelcomeEmail(data);
  return sendEmail(template);
}

/**
 * Envía email de confirmación de pedido
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const template = createOrderConfirmationEmail(data);
  return sendEmail(template);
}

/**
 * Envía email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(data: PasswordResetData) {
  const template = createPasswordResetEmail(data);
  return sendEmail(template);
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Verifica si el servicio de email está configurado
 */
export function isEmailServiceReady(): boolean {
  return !!(emailConfig.resendApiKey && emailConfig.fromEmail);
}

/**
 * Obtiene la configuración de email actual
 */
export function getEmailServiceConfig() {
  return {
    isReady: isEmailServiceReady(),
    fromEmail: emailConfig.fromEmail,
    supportEmail: emailConfig.supportEmail,
    hasApiKey: !!emailConfig.resendApiKey,
  };
}
