'use client'

import { toast } from '@/components/ui/use-toast'

export interface EmailNotificationConfig {
  to: string | string[]
  subject: string
  template: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high'
  scheduledAt?: Date
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
}

export class EmailNotificationService {
  private static instance: EmailNotificationService
  private apiEndpoint = '/api/notifications/email'

  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService()
    }
    return EmailNotificationService.instance
  }

  async sendNotification(config: EmailNotificationConfig): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Error al enviar notificación por email')
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error sending email notification:', error)
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación por email',
        variant: 'destructive',
      })
      return false
    }
  }

  async sendOrderConfirmation(orderData: {
    customerEmail: string
    orderId: string
    customerName: string
    items: Array<{ name: string; quantity: number; price: number }>
    total: number
    shippingAddress: any
  }): Promise<boolean> {
    return this.sendNotification({
      to: orderData.customerEmail,
      subject: `Confirmación de pedido #${orderData.orderId}`,
      template: 'order-confirmation',
      data: orderData,
      priority: 'high',
    })
  }

  async sendShippingNotification(shippingData: {
    customerEmail: string
    orderId: string
    trackingNumber: string
    estimatedDelivery: string
  }): Promise<boolean> {
    return this.sendNotification({
      to: shippingData.customerEmail,
      subject: `Tu pedido #${shippingData.orderId} está en camino`,
      template: 'shipping-notification',
      data: shippingData,
      priority: 'normal',
    })
  }

  async sendPasswordReset(userData: {
    email: string
    resetToken: string
    userName: string
  }): Promise<boolean> {
    return this.sendNotification({
      to: userData.email,
      subject: 'Restablecer contraseña',
      template: 'password-reset',
      data: userData,
      priority: 'high',
    })
  }

  async sendWelcomeEmail(userData: {
    email: string
    userName: string
    verificationToken?: string
  }): Promise<boolean> {
    return this.sendNotification({
      to: userData.email,
      subject: '¡Bienvenido a nuestra tienda!',
      template: 'welcome',
      data: userData,
      priority: 'normal',
    })
  }

  async sendLowStockAlert(productData: {
    adminEmails: string[]
    productName: string
    currentStock: number
    minimumStock: number
    productId: string
  }): Promise<boolean> {
    return this.sendNotification({
      to: productData.adminEmails,
      subject: `Alerta: Stock bajo - ${productData.productName}`,
      template: 'low-stock-alert',
      data: productData,
      priority: 'high',
    })
  }

  async sendOrderStatusUpdate(statusData: {
    customerEmail: string
    orderId: string
    newStatus: string
    customerName: string
    statusMessage?: string
  }): Promise<boolean> {
    return this.sendNotification({
      to: statusData.customerEmail,
      subject: `Actualización de pedido #${statusData.orderId}`,
      template: 'order-status-update',
      data: statusData,
      priority: 'normal',
    })
  }

  async sendPromotionalEmail(promoData: {
    recipients: string[]
    subject: string
    promoCode?: string
    discount?: number
    validUntil?: string
    products?: Array<{ name: string; price: number; image: string }>
  }): Promise<boolean> {
    return this.sendNotification({
      to: promoData.recipients,
      subject: promoData.subject,
      template: 'promotional',
      data: promoData,
      priority: 'low',
    })
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await fetch('/api/notifications/email/templates')
      if (!response.ok) {
        throw new Error('Error al obtener plantillas')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching email templates:', error)
      return []
    }
  }

  async scheduleEmail(config: EmailNotificationConfig): Promise<boolean> {
    if (!config.scheduledAt) {
      throw new Error('scheduledAt is required for scheduled emails')
    }

    try {
      const response = await fetch('/api/notifications/email/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Error al programar email')
      }

      return true
    } catch (error) {
      console.error('Error scheduling email:', error)
      return false
    }
  }
}

// Instancia singleton para uso global
export const emailService = EmailNotificationService.getInstance()

// Funciones de conveniencia
export const sendOrderConfirmation = (
  orderData: Parameters<EmailNotificationService['sendOrderConfirmation']>[0]
) => emailService.sendOrderConfirmation(orderData)

export const sendShippingNotification = (
  shippingData: Parameters<EmailNotificationService['sendShippingNotification']>[0]
) => emailService.sendShippingNotification(shippingData)

export const sendPasswordReset = (
  userData: Parameters<EmailNotificationService['sendPasswordReset']>[0]
) => emailService.sendPasswordReset(userData)

export const sendWelcomeEmail = (
  userData: Parameters<EmailNotificationService['sendWelcomeEmail']>[0]
) => emailService.sendWelcomeEmail(userData)

export const sendLowStockAlert = (
  productData: Parameters<EmailNotificationService['sendLowStockAlert']>[0]
) => emailService.sendLowStockAlert(productData)
