'use client';

// ===================================
// ADVANCED ERROR BOUNDARY SYSTEM
// ===================================
// Sistema avanzado de manejo de errores con recuperación automática

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ===================================
// INTERFACES Y TIPOS
// ===================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  lastErrorTime: number;
  errorType: 'component' | 'chunk' | 'network' | 'unknown';
  recoveryStrategy: 'retry' | 'fallback' | 'redirect' | 'reload';
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableAutoRecovery?: boolean;
  recoveryTimeout?: number;
  level?: 'page' | 'section' | 'component';
  context?: string;
  enableReporting?: boolean;
}

export interface ErrorReport {
  errorId: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo: {
    componentStack: string;
  };
  context: {
    level: string;
    component: string;
    url: string;
    userAgent: string;
    userId?: string;
  };
  recovery: {
    strategy: string;
    retryCount: number;
    successful: boolean;
  };
  performance: {
    timeToError: number;
    memoryUsage?: number;
  };
}

// ===================================
// ERROR BOUNDARY PRINCIPAL
// ===================================

export class AdvancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private recoveryTimeoutId: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0,
      errorType: 'unknown',
      recoveryStrategy: 'retry'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorType = AdvancedErrorBoundary.classifyError(error);
    const recoveryStrategy = AdvancedErrorBoundary.determineRecoveryStrategy(error, errorType);

    return {
      hasError: true,
      error,
      errorId,
      errorType,
      recoveryStrategy,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true } = this.props;
    
    this.setState({ errorInfo });

    // Reportar error
    if (enableReporting) {
      this.reportError(error, errorInfo);
    }

    // Callback personalizado
    if (onError) {
      onError(error, errorInfo, this.state.errorId);
    }

    // Intentar recuperación automática
    if (this.props.enableAutoRecovery) {
      this.attemptAutoRecovery();
    }

    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
    }
  }

  // ===================================
  // MÉTODOS DE CLASIFICACIÓN
  // ===================================

  static classifyError(error: Error): ErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Error de chunk loading (lazy loading)
    if (message.includes('loading chunk') || message.includes('loading css chunk')) {
      return 'chunk';
    }

    // Error de red
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }

    // Error de componente
    if (stack.includes('react') || message.includes('render') || message.includes('component')) {
      return 'component';
    }

    return 'unknown';
  }

  static determineRecoveryStrategy(
    error: Error, 
    errorType: ErrorBoundaryState['errorType']
  ): ErrorBoundaryState['recoveryStrategy'] {
    switch (errorType) {
      case 'chunk':
        return 'reload'; // Recargar para obtener chunks actualizados
      case 'network':
        return 'retry'; // Reintentar operación de red
      case 'component':
        return 'fallback'; // Mostrar UI de fallback
      default:
        return 'retry';
    }
  }

  // ===================================
  // MÉTODOS DE RECUPERACIÓN
  // ===================================

  attemptAutoRecovery = () => {
    const { recoveryTimeout = 5000 } = this.props;
    const { recoveryStrategy } = this.state;

    this.recoveryTimeoutId = setTimeout(() => {
      switch (recoveryStrategy) {
        case 'retry':
          this.handleRetry();
          break;
        case 'reload':
          window.location.reload();
          break;
        case 'redirect':
          window.location.href = '/';
          break;
        default:
          // Fallback ya se maneja en render
          break;
      }
    }, recoveryTimeout);
  };

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('🔄 Max retries reached, showing fallback UI');
      return;
    }

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }, retryDelay * (retryCount + 1)); // Backoff exponencial
  };

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  // ===================================
  // REPORTE DE ERRORES
  // ===================================

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const report: ErrorReport = {
        errorId: this.state.errorId,
        timestamp: Date.now(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: {
          level: this.props.level || 'component',
          component: this.props.context || 'unknown',
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.getUserId()
        },
        recovery: {
          strategy: this.state.recoveryStrategy,
          retryCount: this.state.retryCount,
          successful: false
        },
        performance: {
          timeToError: Date.now() - this.startTime,
          memoryUsage: this.getMemoryUsage()
        }
      };

      // Enviar reporte al sistema de monitoreo
      await this.sendErrorReport(report);

    } catch (reportError) {
      console.error('❌ Failed to report error:', reportError);
    }
  };

  private getUserId(): string | undefined {
    // Intentar obtener ID de usuario de diferentes fuentes
    try {
      // Clerk
      const clerkUser = (window as any).__clerk_user;
      if (clerkUser?.id) {return clerkUser.id;}

      // LocalStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.id;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private getMemoryUsage(): number | undefined {
    try {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('❌ Failed to send error report:', error);
    }
  }

  // ===================================
  // RENDER
  // ===================================

  render() {
    const { hasError, error, errorType, recoveryStrategy, retryCount } = this.state;
    const { children, fallback, enableRetry = true, maxRetries = 3, level = 'component' } = this.props;

    if (hasError && error) {
      // Si hay un fallback personalizado, usarlo
      if (fallback) {
        return fallback;
      }

      // Renderizar UI de error apropiada según el nivel
      return this.renderErrorUI(error, errorType, recoveryStrategy, retryCount, maxRetries, enableRetry, level);
    }

    return children;
  }

  private renderErrorUI(
    error: Error,
    errorType: ErrorBoundaryState['errorType'],
    recoveryStrategy: ErrorBoundaryState['recoveryStrategy'],
    retryCount: number,
    maxRetries: number,
    enableRetry: boolean,
    level: string
  ) {
    const isPageLevel = level === 'page';
    const canRetry = enableRetry && retryCount < maxRetries;

    if (isPageLevel) {
      return this.renderPageErrorUI(error, errorType, canRetry);
    } else {
      return this.renderComponentErrorUI(error, errorType, canRetry);
    }
  }

  private renderPageErrorUI(error: Error, errorType: ErrorBoundaryState['errorType'], canRetry: boolean) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">¡Oops! Algo salió mal</CardTitle>
            <CardDescription>
              {this.getErrorMessage(errorType)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertTitle>Detalles del Error</AlertTitle>
              <AlertDescription className="text-sm">
                ID: {this.state.errorId}<br />
                Tipo: {errorType}<br />
                {process.env.NODE_ENV === 'development' && (
                  <>Mensaje: {error.message}</>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              {canRetry && (
                <Button onClick={this.handleManualRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </Button>
              )}
              <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </Button>
              <Button variant="outline" onClick={this.handleReload} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </Button>
            </div>

            <div className="text-center">
              <Button variant="link" size="sm" onClick={() => this.reportIssue()}>
                <Mail className="w-4 h-4 mr-2" />
                Reportar problema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderComponentErrorUI(error: Error, errorType: ErrorBoundaryState['errorType'], canRetry: boolean) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">Error en componente</span>
        </div>
        <p className="text-sm text-red-700 mb-3">
          {this.getErrorMessage(errorType)}
        </p>
        {canRetry && (
          <Button size="sm" variant="outline" onClick={this.handleManualRetry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  private getErrorMessage(errorType: ErrorBoundaryState['errorType']): string {
    switch (errorType) {
      case 'chunk':
        return 'Error cargando recursos. La página se recargará automáticamente.';
      case 'network':
        return 'Error de conexión. Verifica tu conexión a internet.';
      case 'component':
        return 'Error en el componente. Intentando recuperación automática.';
      default:
        return 'Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.';
    }
  }

  private reportIssue = () => {
    const subject = `Error Report - ${this.state.errorId}`;
    const body = `Error ID: ${this.state.errorId}\nTipo: ${this.state.errorType}\nURL: ${window.location.href}\nFecha: ${new Date().toISOString()}`;
    const mailtoUrl = `mailto:soporte@pinteya.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };
}









