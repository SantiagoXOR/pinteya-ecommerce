/**
 * Test simplificado para AuthSection con NextAuth
 * Enfocado en validar la funcionalidad core sin complejidades
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import AuthSection from '../../AuthSection'

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

describe('AuthSection - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('should render sign in button when unauthenticated', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-white/20', 'hover:bg-white/30')
    })

    it('should render Google icon in button', () => {
      render(<AuthSection />)
      
      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-5', 'h-5')
    })

    it('should call signIn when button is clicked', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockSignIn).toHaveBeenCalledWith('google')
    })

    it('should have correct CSS classes for translucent button', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'relative',
        'bg-white/20',
        'hover:bg-white/30',
        'backdrop-blur-sm',
        'border-2',
        'border-white/30',
        'rounded-full'
      )
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated'
      } as any)
    })

    it('should render admin link when authenticated', () => {
      render(<AuthSection />)
      
      const adminLink = screen.getByRole('link')
      expect(adminLink).toBeInTheDocument()
      expect(adminLink).toHaveAttribute('href', '/admin')
    })

    it('should render user avatar when authenticated', () => {
      render(<AuthSection />)
      
      const avatar = screen.getByText('J') // First letter of Juan
      expect(avatar).toBeInTheDocument()
    })

    it('should have admin button with correct styling', () => {
      render(<AuthSection />)
      
      const adminLink = screen.getByRole('link')
      expect(adminLink).toHaveClass(
        'bg-orange-600',
        'hover:bg-orange-700',
        'text-white'
      )
    })
  })

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      } as any)
    })

    it('should render loading skeleton', () => {
      render(<AuthSection />)

      const skeleton = screen.getByText((content, element) => {
        return element?.classList.contains('animate-pulse') || false
      })
      expect(skeleton).toHaveClass('animate-pulse')
    })
  })

  describe('Variants', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('should render mobile variant correctly', () => {
      render(<AuthSection variant="mobile" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:scale-110')
    })

    it('should render topbar variant with text', () => {
      render(<AuthSection variant="topbar" />)
      
      const button = screen.getByText('Iniciar Sesión')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('text-gray-800')
    })

    it('should render default variant correctly', () => {
      render(<AuthSection variant="default" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:scale-105')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('should be keyboard accessible', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      
      // Button should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('should have proper button role', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Visual Consistency', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('should maintain consistent icon size across variants', () => {
      const variants = ['default', 'mobile'] as const
      
      variants.forEach(variant => {
        const { unmount } = render(<AuthSection variant={variant} />)
        
        const svg = screen.getByRole('button').querySelector('svg')
        expect(svg).toHaveClass('w-5', 'h-5')
        
        unmount()
      })
    })

    it('should have hover effects', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-white/30')
    })

    it('should have transform effects', () => {
      render(<AuthSection />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('transform', 'hover:scale-105')
    })
  })

  describe('Google Branding', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)
    })

    it('should have Google colors in SVG paths', () => {
      render(<AuthSection />)
      
      const svg = screen.getByRole('button').querySelector('svg')
      const paths = svg?.querySelectorAll('path')
      
      expect(paths).toHaveLength(4)
      
      // Check for Google brand colors
      const colors = Array.from(paths || []).map(path => path.getAttribute('fill'))
      expect(colors).toContain('#4285F4') // Google Blue
      expect(colors).toContain('#34A853') // Google Green
      expect(colors).toContain('#FBBC05') // Google Yellow
      expect(colors).toContain('#EA4335') // Google Red
    })
  })
})
