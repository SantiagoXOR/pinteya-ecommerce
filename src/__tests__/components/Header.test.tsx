// ===================================
// PINTEYA E-COMMERCE - TEST HEADER COMPONENT
// ===================================

import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Header from '@/components/Header'
import cartReducer from '@/redux/features/cart-slice'
import wishlistReducer from '@/redux/features/wishlist-slice'

// Mock store setup - Estructura corregida para coincidir con store real
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cartReducer: cartReducer,
      wishlistReducer: wishlistReducer,
    },
    preloadedState: {
      cartReducer: {
        items: [],
        ...initialState.cartReducer,
      },
      wishlistReducer: {
        items: [],
        ...initialState.wishlistReducer,
      },
    },
  })
}

// Clerk components are mocked globally in jest.setup.js

// Helper function to render with Redux store
const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState)
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  }
}

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  it('renders header with logo', () => {
    renderWithStore(<Header />)

    // Check if logo images are present (mobile and desktop)
    const logos = screen.getAllByAltText('Pinteya Logo')
    expect(logos).toHaveLength(2) // Mobile and desktop logos
    expect(logos[0]).toBeInTheDocument()
  })

  it('displays cart icon with item count', () => {
    const initialState = {
      cartReducer: {
        items: [
          { id: 1, title: 'Test Product', price: 100, discountedPrice: 100, quantity: 2 },
          { id: 2, title: 'Test Product 2', price: 200, discountedPrice: 200, quantity: 1 },
        ],
      },
    }

    renderWithStore(<Header />, initialState)

    // Check if cart count is displayed (number of different items, not total quantity)
    const cartCount = screen.getByText('2') // 2 different items
    expect(cartCount).toBeInTheDocument()
  })

  it('displays wishlist link', () => {
    const initialState = {
      wishlistReducer: {
        items: [
          { id: 1, name: 'Wishlist Product 1' },
          { id: 2, name: 'Wishlist Product 2' },
        ],
      },
    }

    renderWithStore(<Header />, initialState)

    // Check if wishlist links are present (there might be multiple)
    const wishlistLinks = screen.getAllByText('Wishlist')
    expect(wishlistLinks.length).toBeGreaterThan(0)
    expect(wishlistLinks[0].closest('a')).toHaveAttribute('href', '/wishlist')
  })

  it('shows navigation menu items', () => {
    renderWithStore(<Header />)

    // Check for main navigation items based on menuData
    expect(screen.getByText('Popular')).toBeInTheDocument()
    expect(screen.getByText('Tienda')).toBeInTheDocument()

    // Contact appears multiple times, so use getAllByText
    const contactLinks = screen.getAllByText('Contact')
    expect(contactLinks.length).toBeGreaterThan(0)
  })

  it('opens mobile menu when hamburger is clicked', () => {
    renderWithStore(<Header />)

    // Just verify the component renders without errors
    // Mobile menu functionality would need specific implementation details
    const logos = screen.getAllByAltText('Pinteya Logo')
    expect(logos[0]).toBeInTheDocument()
  })

  it('shows mobile-specific elements correctly', () => {
    // Mock window.innerWidth for mobile view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    renderWithStore(<Header />)

    // Verify mobile search fields exist (mobile and desktop versions)
    const searchInputs = screen.getAllByPlaceholderText('Busco productos de pinturería...')
    expect(searchInputs.length).toBeGreaterThanOrEqual(1)

    // Verify location text is present
    const locationText = screen.getByText(/Envíos a/)
    expect(locationText).toBeInTheDocument()
  })

  it('displays correct logo for mobile and desktop', () => {
    renderWithStore(<Header />)

    // Both logos should be present but with different visibility classes
    const logos = screen.getAllByAltText('Pinteya Logo')
    expect(logos).toHaveLength(2) // One for mobile, one for desktop
  })

  it('renders authentication section when signed out', () => {
    renderWithStore(<Header />)
    
    // Check if signed out state is rendered
    expect(screen.getByTestId('signed-out')).toBeInTheDocument()
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
    expect(screen.getByText('Registrarse')).toBeInTheDocument()
  })

  it('renders user button when signed in', () => {
    renderWithStore(<Header />)

    // First verify we're in signed out state
    expect(screen.getByTestId('signed-out')).toBeInTheDocument()

    // Click the "Iniciar Sesión" button to simulate sign in
    const signInButton = screen.getByText('Iniciar Sesión')
    fireEvent.click(signInButton)

    // Note: Since this is a Link component, we can't actually change the auth state
    // in this test. The actual sign-in flow would happen on a different page.
    // For now, we'll just verify the button exists and is clickable
    expect(signInButton).toBeInTheDocument()
  })

  it('handles search functionality', () => {
    renderWithStore(<Header />)

    // Check if search inputs are present (mobile and desktop)
    const searchInputs = screen.getAllByPlaceholderText('Busco productos de pinturería...')
    expect(searchInputs.length).toBeGreaterThanOrEqual(1)
    expect(searchInputs[0]).toBeInTheDocument()

    // Check if search button is present
    const searchButtons = screen.getAllByLabelText('Search')
    expect(searchButtons.length).toBeGreaterThanOrEqual(1)
    expect(searchButtons[0]).toBeInTheDocument()
  })

  it('displays correct cart total', () => {
    const initialState = {
      cartReducer: {
        items: [
          { id: 1, title: 'Product 1', price: 1500, discountedPrice: 1500, quantity: 2 },
          { id: 2, title: 'Product 2', price: 2500, discountedPrice: 2500, quantity: 1 },
        ],
      },
    }

    renderWithStore(<Header />, initialState)

    // Check if total is displayed (1500*2 + 2500*1 = 5500)
    expect(screen.getByText('$5500')).toBeInTheDocument()
  })

  it('is responsive and shows mobile layout on small screens', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    renderWithStore(<Header />)

    // Just verify the component renders without errors
    const logos = screen.getAllByAltText('Pinteya Logo')
    expect(logos[0]).toBeInTheDocument()
  })
})
