import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter } from 'next/navigation';
import { BottomNavigation, type BottomNavigationItem } from '@/components/ui/bottom-navigation';
import cartReducer from '@/redux/features/cart-slice';
import { Home, Tag, Package } from 'lucide-react';

// Mock Next.js router
const mockUsePathname = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

// Mock store
const createMockStore = (cartItems = []) => {
  return configureStore({
    reducer: {
      cartReducer: cartReducer,
    },
    preloadedState: {
      cartReducer: {
        items: cartItems,
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, cartItems = []) => {
  const store = createMockStore(cartItems);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('BottomNavigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders default navigation items', () => {
    renderWithStore(<BottomNavigation />);

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Ofertas')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Cotizador')).toBeInTheDocument();
    expect(screen.getByText('Menú')).toBeInTheDocument();
  });

  it('shows cart badge when there are items in cart', () => {
    const cartItems = [
      { id: '1', name: 'Product 1', price: 100, quantity: 2 },
      { id: '2', name: 'Product 2', price: 200, quantity: 1 },
    ];

    renderWithStore(<BottomNavigation />, cartItems);

    // Should show badge with cart items count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/shop');

    renderWithStore(<BottomNavigation />);

    const offersLink = screen.getByLabelText('Ofertas');
    expect(offersLink).toHaveClass('text-primary-700');
  });

  it('renders custom navigation items', () => {
    const customItems: BottomNavigationItem[] = [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        icon: <Home className="w-5 h-5" />,
      },
      {
        id: 'shop',
        label: 'Shop',
        href: '/shop',
        icon: <Tag className="w-5 h-5" />,
        badge: 5,
      },
    ];

    renderWithStore(<BottomNavigation items={customItems} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Badge
  });

  it('hides labels when showLabels is false', () => {
    renderWithStore(<BottomNavigation showLabels={false} />);

    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
    expect(screen.queryByText('Ofertas')).not.toBeInTheDocument();
  });

  it('limits items to maxItems', () => {
    renderWithStore(<BottomNavigation maxItems={3} />);

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Ofertas')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.queryByText('Cotizador')).not.toBeInTheDocument();
    expect(screen.queryByText('Menú')).not.toBeInTheDocument();
  });

  it('handles disabled items', () => {
    const customItems: BottomNavigationItem[] = [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        icon: <Home className="w-5 h-5" />,
      },
      {
        id: 'disabled',
        label: 'Disabled',
        href: '/disabled',
        icon: <Package className="w-5 h-5" />,
        disabled: true,
      },
    ];

    renderWithStore(<BottomNavigation items={customItems} />);

    const disabledLink = screen.getByLabelText('Disabled');
    expect(disabledLink).toHaveClass('opacity-50', 'pointer-events-none');
  });

  it('shows badge with 99+ for high numbers', () => {
    const customItems: BottomNavigationItem[] = [
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: <Package className="w-5 h-5" />,
        badge: 150,
      },
    ];

    renderWithStore(<BottomNavigation items={customItems} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { container } = renderWithStore(<BottomNavigation variant="dark" />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-gray-900/95', 'border-gray-700');
  });

  it('applies warm variant by default', () => {
    const { container } = renderWithStore(<BottomNavigation />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-orange-50/95', 'border-orange-100');
  });

  it('has proper accessibility attributes', () => {
    renderWithStore(<BottomNavigation />);

    const homeLink = screen.getByLabelText('Inicio');
    expect(homeLink).toHaveAttribute('aria-label', 'Inicio');
  });

  it('shows active indicator for current page', () => {
    mockUsePathname.mockReturnValue('/');

    const { container } = renderWithStore(<BottomNavigation />);

    // Check for active background circle (updated class)
    const activeBackground = container.querySelector('.bg-primary\\/15');
    expect(activeBackground).toBeInTheDocument();
  });

  it('shows dot indicator when cart is empty', () => {
    const { container } = renderWithStore(<BottomNavigation />, []);

    // Should show subtle dot for orders when cart is empty
    const dotIndicator = container.querySelector('.bg-primary\\/60');
    expect(dotIndicator).toBeInTheDocument();
  });

  it('applies active item styling correctly', () => {
    mockUsePathname.mockReturnValue('/');

    const { container } = renderWithStore(<BottomNavigation />);

    const homeLink = screen.getByLabelText('Inicio');
    expect(homeLink).toHaveClass('bottom-nav-item-active');
    expect(homeLink).toHaveClass('text-primary-700');
  });

  it('shows badge with pulse animation for cart items', () => {
    const cartItems = [{ id: '1', name: 'Product 1', price: 100, quantity: 1 }];
    const { container } = renderWithStore(<BottomNavigation />, cartItems);

    const badge = container.querySelector('.bottom-nav-badge-pulse');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('scales icon when item is active', () => {
    mockUsePathname.mockReturnValue('/');

    const { container } = renderWithStore(<BottomNavigation />);

    // Check for scale-110 class on active item
    const scaledIcon = container.querySelector('.scale-110');
    expect(scaledIcon).toBeInTheDocument();
  });

  it('applies mobile tap highlight styles', () => {
    const { container } = renderWithStore(<BottomNavigation />);

    const navItems = container.querySelectorAll('.bottom-nav-item');
    expect(navItems.length).toBeGreaterThan(0);

    navItems.forEach(item => {
      expect(item).toHaveClass('bottom-nav-item');
    });
  });

  it('handles menu path correctly without persistent active state', () => {
    mockUsePathname.mockReturnValue('/menu');

    const { container } = renderWithStore(<BottomNavigation />);

    // Solo el menú debe estar activo
    const menuLink = screen.getByLabelText('Menú');
    expect(menuLink).toHaveClass('text-primary-700');

    // Otros items no deben estar activos
    const homeLink = screen.getByLabelText('Inicio');
    expect(homeLink).not.toHaveClass('text-primary-700');
  });

  it('prevents menu from activating other paths', () => {
    mockUsePathname.mockReturnValue('/my-account');

    renderWithStore(<BottomNavigation />);

    // Pedidos debe estar activo
    const ordersLink = screen.getByLabelText('Pedidos');
    expect(ordersLink).toHaveClass('text-primary-700');

    // Menú NO debe estar activo
    const menuLink = screen.getByLabelText('Menú');
    expect(menuLink).not.toHaveClass('text-primary-700');
  });
});
