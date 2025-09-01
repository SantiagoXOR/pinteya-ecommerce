/**
 * AuthSection Enterprise Test - Versión NextAuth
 * Enfocado en validar la nueva estructura NextAuth sin dependencias Clerk
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import AuthSection from '../AuthSection'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn()
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// Mock user data
const mockUser = {
  id: 'user_123',
  name: 'Juan Pérez',
  email: 'juan@example.com'
}

describe('AuthSection Enterprise - NextAuth Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Usuario no autenticado', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('debe renderizar botón de Google sign in', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-white/20', 'hover:bg-white/30')
    })

    it('debe mostrar SVG de Google en el botón', () => {
      render(<AuthSection />)
      
      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-5', 'h-5')
    })

    it('debe llamar signIn cuando se hace click', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockSignIn).toHaveBeenCalledWith('google')
    })

    it('debe tener estilos correctos para botón translúcido', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'backdrop-blur-sm',
        'border-2',
        'border-white/30',
        'rounded-full',
        'shadow-lg'
      )
    })
  })

  describe('Usuario autenticado', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated'
      } as any)
    })

    it('debe mostrar enlace de admin cuando está autenticado', () => {
      render(<AuthSection />)
      
      const adminLink = screen.getByRole('link')
      expect(adminLink).toBeInTheDocument()
      expect(adminLink).toHaveAttribute('href', '/admin')
    })

    it('debe mostrar avatar del usuario', () => {
      render(<AuthSection />)

      const avatar = screen.getByText('J') // Primera letra de Juan
      expect(avatar).toBeInTheDocument()
      // Verificar que tiene un contenedor padre
      expect(avatar.parentElement).toBeInTheDocument()
    })

    it('debe tener botón admin con estilos correctos', () => {
      render(<AuthSection />)
      
      const adminLink = screen.getByRole('link')
      expect(adminLink).toHaveClass(
        'bg-orange-600',
        'hover:bg-orange-700',
        'text-white'
      )
    })

    it('debe mostrar texto Admin en desktop', () => {
      render(<AuthSection />)
      
      const adminText = screen.getByText('Admin')
      expect(adminText).toBeInTheDocument()
    })
  })

  describe('Estado de carga', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      } as any)
    })

    it('debe mostrar skeleton de carga', () => {
      render(<AuthSection />)
      
      const skeleton = screen.getByText((content, element) => {
        return element?.classList.contains('animate-pulse') || false
      })
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe('Variantes del componente', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('debe renderizar variante mobile correctamente', () => {
      render(<AuthSection variant="mobile" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:scale-110')
    })

    it('debe renderizar variante topbar con texto', () => {
      render(<AuthSection variant="topbar" />)
      
      const button = screen.getByText('Iniciar Sesión')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('text-gray-800')
    })

    it('debe renderizar variante default con efectos', () => {
      render(<AuthSection variant="default" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:scale-105')
    })
  })

  describe('Variante mobile autenticado', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated'
      } as any)
    })

    it('debe mostrar botón admin y avatar en mobile', () => {
      render(<AuthSection variant="mobile" />)
      
      const adminLink = screen.getByRole('link')
      const avatar = screen.getByText('J')
      
      expect(adminLink).toHaveAttribute('href', '/admin')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('Variante topbar autenticado', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated'
      } as any)
    })

    it('debe mostrar solo avatar en topbar', () => {
      render(<AuthSection variant="topbar" />)

      const avatar = screen.getByText('J')
      expect(avatar).toBeInTheDocument()
      // Verificar que tiene un contenedor padre apropiado
      expect(avatar.parentElement).toBeInTheDocument()
    })
  })

  describe('Accesibilidad básica', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('debe ser accesible por teclado', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('debe tener rol de botón correcto', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Colores de Google branding', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('debe tener colores correctos de Google en SVG', () => {
      render(<AuthSection />)
      
      const svg = screen.getByRole('button').querySelector('svg')
      const paths = svg?.querySelectorAll('path')
      
      expect(paths).toHaveLength(4)
      
      const colors = Array.from(paths || []).map(path => path.getAttribute('fill'))
      expect(colors).toContain('#4285F4') // Google Blue
      expect(colors).toContain('#34A853') // Google Green
      expect(colors).toContain('#FBBC05') // Google Yellow
      expect(colors).toContain('#EA4335') // Google Red
    })
  })
})
