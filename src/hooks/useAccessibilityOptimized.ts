// ===================================
// HOOK: useAccessibilityOptimized - Hook optimizado para accessibility
// ===================================

import { useState, useEffect, useCallback, useMemo } from 'react';

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  fontSize: 'small' | 'medium' | 'large';
}

interface AccessibilityState extends AccessibilityPreferences {
  isKeyboardUser: boolean;
  screenReaderActive: boolean;
  focusVisible: boolean;
}

/**
 * Hook optimizado para manejo de accessibility
 * 
 * Características:
 * - Detección automática de preferencias del usuario
 * - Manejo de navegación por teclado
 * - Soporte para screen readers
 * - Optimizado para performance
 */
export const useAccessibilityOptimized = () => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorScheme: 'no-preference',
    fontSize: 'medium',
    isKeyboardUser: false,
    screenReaderActive: false,
    focusVisible: false,
  });

  // Detectar preferencias del sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      
      let prefersColorScheme: 'light' | 'dark' | 'no-preference' = 'no-preference';
      if (prefersDark) prefersColorScheme = 'dark';
      else if (prefersLight) prefersColorScheme = 'light';

      setAccessibilityState(prev => ({
        ...prev,
        prefersReducedMotion,
        prefersHighContrast,
        prefersColorScheme,
      }));
    };

    // Detectar cambios en las preferencias
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-color-scheme: light)'),
    ];

    mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences));
    updatePreferences();

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences));
    };
  }, []);

  // Detectar navegación por teclado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isKeyboardUser = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardUser = true;
        setAccessibilityState(prev => ({ ...prev, isKeyboardUser: true, focusVisible: true }));
      }
    };

    const handleMouseDown = () => {
      if (isKeyboardUser) {
        isKeyboardUser = false;
        setAccessibilityState(prev => ({ ...prev, isKeyboardUser: false, focusVisible: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Detectar screen readers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar screen readers comunes
    const screenReaderActive = !!(
      window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack|Dragon/i) ||
      window.speechSynthesis ||
      document.querySelector('[aria-hidden]')
    );

    setAccessibilityState(prev => ({ ...prev, screenReaderActive }));
  }, []);

  // Helpers memoizados para clases CSS
  const accessibilityClasses = useMemo(() => ({
    // Clases base
    base: [
      accessibilityState.prefersReducedMotion && 'motion-reduce',
      accessibilityState.prefersHighContrast && 'high-contrast',
      accessibilityState.isKeyboardUser && 'keyboard-user',
      accessibilityState.screenReaderActive && 'screen-reader-active',
    ].filter(Boolean).join(' '),

    // Focus visible
    focusVisible: accessibilityState.focusVisible 
      ? 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
      : 'focus:outline-none',

    // Animaciones
    motion: accessibilityState.prefersReducedMotion 
      ? 'transition-none' 
      : 'transition-all duration-200 ease-in-out',

    // Contraste
    contrast: accessibilityState.prefersHighContrast 
      ? 'contrast-125 brightness-110' 
      : '',

    // Tamaño de fuente
    fontSize: {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    }[accessibilityState.fontSize],
  }), [accessibilityState]);

  // Helpers para ARIA
  const ariaHelpers = useMemo(() => ({
    // Generar IDs únicos para ARIA
    generateId: (prefix: string = 'aria') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
    
    // Props comunes para elementos interactivos
    interactiveProps: (label: string, description?: string) => ({
      'aria-label': label,
      'aria-describedby': description ? `desc-${Math.random().toString(36).substr(2, 9)}` : undefined,
      tabIndex: 0,
    }),

    // Props para elementos de navegación
    navigationProps: (current?: boolean) => ({
      role: 'navigation',
      'aria-current': current ? 'page' : undefined,
    }),

    // Props para formularios
    formProps: (label: string, required?: boolean, invalid?: boolean, errorMessage?: string) => ({
      'aria-label': label,
      'aria-required': required,
      'aria-invalid': invalid,
      'aria-describedby': errorMessage ? `error-${Math.random().toString(36).substr(2, 9)}` : undefined,
    }),
  }), []);

  // Funciones de utilidad
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof window === 'undefined' || !accessibilityState.screenReaderActive) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover después de que se haya anunciado
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [accessibilityState.screenReaderActive]);

  const focusElement = useCallback((selector: string | HTMLElement) => {
    if (typeof window === 'undefined') return;

    const element = typeof selector === 'string' 
      ? document.querySelector(selector) as HTMLElement
      : selector;

    if (element && typeof element.focus === 'function') {
      element.focus();
      
      // Scroll into view si es necesario
      element.scrollIntoView({ 
        behavior: accessibilityState.prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center' 
      });
    }
  }, [accessibilityState.prefersReducedMotion]);

  return {
    // Estado
    ...accessibilityState,
    
    // Helpers
    classes: accessibilityClasses,
    aria: ariaHelpers,
    
    // Funciones
    announceToScreenReader,
    focusElement,
    
    // Configuración para componentes
    componentConfig: {
      animations: !accessibilityState.prefersReducedMotion,
      highContrast: accessibilityState.prefersHighContrast,
      keyboardNavigation: accessibilityState.isKeyboardUser,
      screenReader: accessibilityState.screenReaderActive,
    },
  };
};

/**
 * Hook simplificado para skip links
 */
export const useSkipLinks = () => {
  const { focusElement, announceToScreenReader } = useAccessibilityOptimized();

  const skipToMain = useCallback(() => {
    focusElement('#main-content');
    announceToScreenReader('Saltando al contenido principal');
  }, [focusElement, announceToScreenReader]);

  const skipToNavigation = useCallback(() => {
    focusElement('#main-navigation');
    announceToScreenReader('Saltando a la navegación principal');
  }, [focusElement, announceToScreenReader]);

  return {
    skipToMain,
    skipToNavigation,
  };
};

export default useAccessibilityOptimized;
