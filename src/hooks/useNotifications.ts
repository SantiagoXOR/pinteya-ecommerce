'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { EmailNotificationType } from '@/app/api/user/notifications/email/route';

interface NotificationOptions {
  showToast?: boolean;
  sendEmail?: boolean;
  toastType?: 'success' | 'error' | 'info' | 'warning';
  toastDuration?: number;
}

interface EmailNotificationData {
  type: EmailNotificationType;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

interface UseNotificationsReturn {
  notifyProfileChange: (
    message: string,
    emailData?: EmailNotificationData,
    options?: NotificationOptions
  ) => Promise<void>;
  notifyAvatarChange: (
    message: string,
    options?: NotificationOptions
  ) => Promise<void>;
  notifyAddressChange: (
    message: string,
    options?: NotificationOptions
  ) => Promise<void>;
  notifySecurityAlert: (
    message: string,
    emailData?: EmailNotificationData,
    options?: NotificationOptions
  ) => Promise<void>;
  sendEmailNotification: (data: EmailNotificationData) => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  
  // Función para enviar notificación por email
  const sendEmailNotification = useCallback(async (data: EmailNotificationData): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar notificación por email');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error al enviar notificación por email:', error);
      return false;
    }
  }, []);

  // Función para mostrar toast notification
  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    duration?: number
  ) => {
    const toastOptions = duration ? { duration } : undefined;
    
    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'info':
        toast.info(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
    }
  }, []);

  // Notificar cambios de perfil
  const notifyProfileChange = useCallback(async (
    message: string,
    emailData?: EmailNotificationData,
    options: NotificationOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      sendEmail = false,
      toastType = 'success',
      toastDuration,
    } = options;

    // Mostrar toast notification
    if (shouldShowToast) {
      showToast(message, toastType, toastDuration);
    }

    // Enviar notificación por email si es necesario
    if (sendEmail && emailData) {
      try {
        const emailSent = await sendEmailNotification(emailData);
        if (emailSent) {
          console.log('✅ Email notification sent for profile change');
        } else {
          console.warn('⚠️ Failed to send email notification for profile change');
        }
      } catch (error) {
        console.error('❌ Error sending email notification:', error);
      }
    }
  }, [showToast, sendEmailNotification]);

  // Notificar cambios de avatar
  const notifyAvatarChange = useCallback(async (
    message: string,
    options: NotificationOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      toastType = 'success',
      toastDuration,
    } = options;

    if (shouldShowToast) {
      showToast(message, toastType, toastDuration);
    }
  }, [showToast]);

  // Notificar cambios de direcciones
  const notifyAddressChange = useCallback(async (
    message: string,
    options: NotificationOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      toastType = 'success',
      toastDuration,
    } = options;

    if (shouldShowToast) {
      showToast(message, toastType, toastDuration);
    }
  }, [showToast]);

  // Notificar alertas de seguridad
  const notifySecurityAlert = useCallback(async (
    message: string,
    emailData?: EmailNotificationData,
    options: NotificationOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      sendEmail = true, // Por defecto enviar email para alertas de seguridad
      toastType = 'warning',
      toastDuration = 8000, // Duración más larga para alertas
    } = options;

    // Mostrar toast notification
    if (shouldShowToast) {
      showToast(message, toastType, toastDuration);
    }

    // Enviar notificación por email
    if (sendEmail && emailData) {
      try {
        const emailSent = await sendEmailNotification(emailData);
        if (emailSent) {
          console.log('✅ Security alert email sent');
        } else {
          console.warn('⚠️ Failed to send security alert email');
        }
      } catch (error) {
        console.error('❌ Error sending security alert email:', error);
      }
    }
  }, [showToast, sendEmailNotification]);

  return {
    notifyProfileChange,
    notifyAvatarChange,
    notifyAddressChange,
    notifySecurityAlert,
    sendEmailNotification,
  };
}









