'use client'

import { toast } from '@/components/ui/use-toast'

export interface SlackNotificationConfig {
  channel: string
  message: string
  username?: string
  iconEmoji?: string
  attachments?: SlackAttachment[]
  blocks?: SlackBlock[]
  threadTs?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

export interface SlackAttachment {
  color?: 'good' | 'warning' | 'danger' | string
  title?: string
  titleLink?: string
  text?: string
  fields?: Array<{
    title: string
    value: string
    short?: boolean
  }>
  footer?: string
  ts?: number
}

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
  }
  elements?: any[]
  accessory?: any
}

export class SlackNotificationService {
  private static instance: SlackNotificationService
  private webhookUrl: string | null = null
  private botToken: string | null = null
  private apiEndpoint = '/api/notifications/slack'

  static getInstance(): SlackNotificationService {
    if (!SlackNotificationService.instance) {
      SlackNotificationService.instance = new SlackNotificationService()
    }
    return SlackNotificationService.instance
  }

  configure(config: { webhookUrl?: string; botToken?: string }) {
    this.webhookUrl = config.webhookUrl || null
    this.botToken = config.botToken || null
  }

  async sendNotification(config: SlackNotificationConfig): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Error al enviar notificación a Slack')
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error sending Slack notification:', error)
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación a Slack',
        variant: 'destructive'
      })
      return false
    }
  }

  async sendOrderAlert(orderData: {
    orderId: string
    customerName: string
    total: number
    items: Array<{ name: string; quantity: number }>
    status: string
  }): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: 'good',
      title: `Nueva orden #${orderData.orderId}`,
      fields: [
        {
          title: 'Cliente',
          value: orderData.customerName,
          short: true
        },
        {
          title: 'Total',
          value: `$${orderData.total.toFixed(2)}`,
          short: true
        },
        {
          title: 'Estado',
          value: orderData.status,
          short: true
        },
        {
          title: 'Productos',
          value: orderData.items.map(item => `${item.name} (x${item.quantity})`).join('\n'),
          short: false
        }
      ],
      footer: 'Sistema E-commerce',
      ts: Math.floor(Date.now() / 1000)
    }

    return this.sendNotification({
      channel: '#orders',
      message: `Nueva orden recibida: #${orderData.orderId}`,
      attachments: [attachment],
      priority: 'normal'
    })
  }

  async sendLowStockAlert(productData: {
    productName: string
    currentStock: number
    minimumStock: number
    productId: string
  }): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: 'warning',
      title: '⚠️ Alerta de Stock Bajo',
      fields: [
        {
          title: 'Producto',
          value: productData.productName,
          short: true
        },
        {
          title: 'Stock Actual',
          value: productData.currentStock.toString(),
          short: true
        },
        {
          title: 'Stock Mínimo',
          value: productData.minimumStock.toString(),
          short: true
        },
        {
          title: 'ID Producto',
          value: productData.productId,
          short: true
        }
      ],
      footer: 'Sistema de Inventario',
      ts: Math.floor(Date.now() / 1000)
    }

    return this.sendNotification({
      channel: '#inventory',
      message: `🚨 Stock bajo detectado para: ${productData.productName}`,
      attachments: [attachment],
      priority: 'high'
    })
  }

  async sendErrorAlert(errorData: {
    error: string
    context: string
    userId?: string
    timestamp: Date
    severity: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<boolean> {
    const colorMap = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    }

    const attachment: SlackAttachment = {
      color: colorMap[errorData.severity],
      title: `🚨 Error ${errorData.severity.toUpperCase()}`,
      fields: [
        {
          title: 'Error',
          value: errorData.error,
          short: false
        },
        {
          title: 'Contexto',
          value: errorData.context,
          short: false
        },
        {
          title: 'Usuario',
          value: errorData.userId || 'N/A',
          short: true
        },
        {
          title: 'Severidad',
          value: errorData.severity.toUpperCase(),
          short: true
        }
      ],
      footer: 'Sistema de Monitoreo',
      ts: Math.floor(errorData.timestamp.getTime() / 1000)
    }

    return this.sendNotification({
      channel: '#errors',
      message: `Error detectado en el sistema`,
      attachments: [attachment],
      priority: errorData.severity === 'critical' ? 'critical' : 'high'
    })
  }

  async sendSalesReport(reportData: {
    period: string
    totalSales: number
    totalOrders: number
    averageOrderValue: number
    topProducts: Array<{ name: string; sales: number }>
  }): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: 'good',
      title: `📊 Reporte de Ventas - ${reportData.period}`,
      fields: [
        {
          title: 'Ventas Totales',
          value: `$${reportData.totalSales.toFixed(2)}`,
          short: true
        },
        {
          title: 'Órdenes Totales',
          value: reportData.totalOrders.toString(),
          short: true
        },
        {
          title: 'Valor Promedio por Orden',
          value: `$${reportData.averageOrderValue.toFixed(2)}`,
          short: true
        },
        {
          title: 'Top Productos',
          value: reportData.topProducts.map(p => `${p.name}: ${p.sales} ventas`).join('\n'),
          short: false
        }
      ],
      footer: 'Reporte Automático',
      ts: Math.floor(Date.now() / 1000)
    }

    return this.sendNotification({
      channel: '#sales',
      message: `Reporte de ventas generado para ${reportData.period}`,
      attachments: [attachment],
      priority: 'low'
    })
  }

  async sendSystemAlert(alertData: {
    title: string
    message: string
    severity: 'info' | 'warning' | 'error'
    details?: Record<string, any>
  }): Promise<boolean> {
    const colorMap = {
      info: 'good',
      warning: 'warning',
      error: 'danger'
    }

    const emojiMap = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨'
    }

    const attachment: SlackAttachment = {
      color: colorMap[alertData.severity],
      title: `${emojiMap[alertData.severity]} ${alertData.title}`,
      text: alertData.message,
      fields: alertData.details ? Object.entries(alertData.details).map(([key, value]) => ({
        title: key,
        value: String(value),
        short: true
      })) : undefined,
      footer: 'Sistema de Alertas',
      ts: Math.floor(Date.now() / 1000)
    }

    return this.sendNotification({
      channel: '#system',
      message: alertData.message,
      attachments: [attachment],
      priority: alertData.severity === 'error' ? 'high' : 'normal'
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/slack/test', {
        method: 'POST'
      })
      return response.ok
    } catch (error) {
      console.error('Error testing Slack connection:', error)
      return false
    }
  }
}

// Instancia singleton para uso global
export const slackService = SlackNotificationService.getInstance()

// Funciones de conveniencia
export const sendOrderAlert = (orderData: Parameters<SlackNotificationService['sendOrderAlert']>[0]) => 
  slackService.sendOrderAlert(orderData)

export const sendLowStockAlert = (productData: Parameters<SlackNotificationService['sendLowStockAlert']>[0]) => 
  slackService.sendLowStockAlert(productData)

export const sendErrorAlert = (errorData: Parameters<SlackNotificationService['sendErrorAlert']>[0]) => 
  slackService.sendErrorAlert(errorData)

export const sendSalesReport = (reportData: Parameters<SlackNotificationService['sendSalesReport']>[0]) => 
  slackService.sendSalesReport(reportData)

export const sendSystemAlert = (alertData: Parameters<SlackNotificationService['sendSystemAlert']>[0]) => 
  slackService.sendSystemAlert(alertData)