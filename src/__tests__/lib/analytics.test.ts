/**
 * Tests para el sistema de Analytics de Pinteya E-commerce
 * Verificación de la corrección del error de runtime en getElementInfo
 */

import { analytics } from '@/lib/analytics';

// Mock del DOM para testing
const mockElement = (props: {
  id?: string;
  className?: string | DOMTokenList;
  tagName?: string;
  getAttribute?: (attr: string) => string | null;
}) => {
  return {
    id: props.id || '',
    className: props.className || '',
    tagName: props.tagName || 'div',
    getAttribute: props.getAttribute || (() => null),
  } as HTMLElement;
};

// Mock de DOMTokenList para simular el comportamiento real
class MockDOMTokenList {
  private classes: string[];

  constructor(classes: string[]) {
    this.classes = classes;
  }

  toString(): string {
    return this.classes.join(' ');
  }

  split(separator: string): string[] {
    return this.toString().split(separator);
  }
}

describe('Analytics - getElementInfo', () => {
  let analyticsManager: any;

  beforeEach(() => {
    // Acceder al método privado para testing
    analyticsManager = analytics as any;
  });

  describe('Manejo de className como string', () => {
    it('debería manejar className como string simple', () => {
      const element = mockElement({
        id: 'test-button',
        className: 'btn btn-primary active',
        tagName: 'BUTTON'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('button#test-button.btn.btn-primary.active');
    });

    it('debería manejar className vacío', () => {
      const element = mockElement({
        id: 'test-div',
        className: '',
        tagName: 'DIV'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('div#test-div');
    });

    it('debería manejar className con espacios extra', () => {
      const element = mockElement({
        className: '  btn   btn-large  active  ',
        tagName: 'BUTTON'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('button.btn.btn-large.active');
    });
  });

  describe('Manejo de className como DOMTokenList', () => {
    it('debería manejar DOMTokenList correctamente', () => {
      const mockTokenList = new MockDOMTokenList(['btn', 'btn-primary', 'active']);
      
      const element = mockElement({
        id: 'test-button',
        className: mockTokenList as any,
        tagName: 'BUTTON'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('button#test-button.btn.btn-primary.active');
    });

    it('debería manejar DOMTokenList vacío', () => {
      const mockTokenList = new MockDOMTokenList([]);
      
      const element = mockElement({
        id: 'test-div',
        className: mockTokenList as any,
        tagName: 'DIV'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('div#test-div');
    });

    it('debería manejar DOMTokenList con clases vacías', () => {
      const mockTokenList = new MockDOMTokenList(['btn', '', 'active', '  ']);
      
      const element = mockElement({
        className: mockTokenList as any,
        tagName: 'SPAN'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('span.btn.active');
    });
  });

  describe('Manejo de data-analytics', () => {
    it('debería incluir data-analytics cuando está presente', () => {
      const element = mockElement({
        className: 'btn',
        tagName: 'BUTTON',
        getAttribute: (attr: string) => attr === 'data-analytics' ? 'add-to-cart' : null
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('button.btn[add-to-cart]');
    });

    it('debería funcionar sin data-analytics', () => {
      const element = mockElement({
        className: 'btn',
        tagName: 'BUTTON',
        getAttribute: () => null
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('button.btn');
    });
  });

  describe('Casos edge', () => {
    it('debería manejar elemento sin id ni className', () => {
      const element = mockElement({
        tagName: 'DIV'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('div');
    });

    it('debería manejar tagName en mayúsculas', () => {
      const element = mockElement({
        className: 'container',
        tagName: 'DIV'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('div.container');
    });

    it('debería manejar className undefined/null', () => {
      const element = mockElement({
        id: 'test',
        className: undefined as any,
        tagName: 'SPAN'
      });

      const result = analyticsManager.getElementInfo(element);
      
      expect(result).toBe('span#test');
    });
  });

  describe('Compatibilidad con elementos reales del DOM', () => {
    it('debería funcionar con elementos button reales', () => {
      // Simular un elemento button real con DOMTokenList
      const realButton = {
        id: 'real-button',
        className: {
          toString: () => 'btn btn-primary',
          split: undefined // DOMTokenList no tiene split
        },
        tagName: 'BUTTON',
        getAttribute: () => null
      } as any;

      const result = analyticsManager.getElementInfo(realButton);
      
      expect(result).toBe('button#real-button.btn.btn-primary');
    });
  });
});
