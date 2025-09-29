// ===================================
// JEST TYPES DECLARATION
// ===================================
// Declaraciones de tipos para Jest y funciones globales de testing

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> extends Function, MockInstance<T, Y> {}
    interface MockInstance<T, Y extends any[]> {
      new (...args: Y): T;
      (...args: Y): T;
    }
  }

  // Funciones globales de Jest
  declare const describe: jest.Describe;
  declare const it: jest.It;
  declare const test: jest.It;
  declare const beforeEach: jest.Lifecycle;
  declare const afterEach: jest.Lifecycle;
  declare const beforeAll: jest.Lifecycle;
  declare const afterAll: jest.Lifecycle;
  declare const expect: jest.Expect;

  // Mock functions
  declare const jest: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.MockedFunction<T>;
    mock: <T>(moduleName: string, factory?: () => T, options?: jest.MockOptions) => T;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
    requireActual: <T = unknown>(moduleName: string) => T;
    requireMock: <T = unknown>(moduleName: string) => T;
    spyOn: typeof jest.spyOn;
    Mock: jest.MockedClass<any>;
  };

  // Global namespace extensions
  namespace global {
    namespace jest {
      interface Mock<T = any, Y extends any[] = any> extends Function, MockInstance<T, Y> {}
    }
  }
}

export {};