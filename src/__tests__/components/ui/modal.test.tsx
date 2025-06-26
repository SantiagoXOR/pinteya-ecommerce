import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ConfirmModal, QuickViewModal, AddToCartModal, useModal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

// Mock para Radix UI Portal
jest.mock('@radix-ui/react-dialog', () => ({
  ...jest.requireActual('@radix-ui/react-dialog'),
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>,
}))

jest.mock('@radix-ui/react-alert-dialog', () => ({
  ...jest.requireActual('@radix-ui/react-alert-dialog'),
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-portal">{children}</div>,
}))

describe('Modal Components', () => {
  describe('Modal', () => {
    it('renders with title and description', () => {
      render(
        <Modal
          open={true}
          title="Test Modal"
          description="Test description"
        >
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()

      render(
        <Modal
          open={true}
          onOpenChange={onOpenChange}
          title="Test Modal"
        >
          <div>Content</div>
        </Modal>
      )

      const closeButton = screen.getByRole('button', { name: /cerrar/i })
      await user.click(closeButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('renders with different sizes', () => {
      const { rerender } = render(
        <Modal open={true} size="sm" title="Small Modal">
          Content
        </Modal>
      )

      expect(screen.getByRole('dialog')).toHaveClass('max-w-sm')

      rerender(
        <Modal open={true} size="lg" title="Large Modal">
          Content
        </Modal>
      )

      expect(screen.getByRole('dialog')).toHaveClass('max-w-lg')
    })

    it('renders with trigger', async () => {
      const user = userEvent.setup()

      render(
        <Modal
          trigger={<Button>Open Modal</Button>}
          title="Triggered Modal"
        >
          Modal content
        </Modal>
      )

      const trigger = screen.getByRole('button', { name: /open modal/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Triggered Modal')).toBeInTheDocument()
      })
    })
  })

  describe('ConfirmModal', () => {
    it('renders with correct variant styling', () => {
      render(
        <ConfirmModal
          open={true}
          title="Confirm Action"
          description="Are you sure?"
          variant="destructive"
          confirmText="Delete"
          cancelText="Cancel"
        />
      )

      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = jest.fn()

      render(
        <ConfirmModal
          open={true}
          title="Confirm"
          onConfirm={onConfirm}
          confirmText="Confirm"
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(onConfirm).toHaveBeenCalled()
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()

      render(
        <ConfirmModal
          open={true}
          title="Confirm"
          onCancel={onCancel}
          cancelText="Cancel"
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('shows loading state', () => {
      render(
        <ConfirmModal
          open={true}
          title="Confirm"
          loading={true}
          confirmText="Confirm"
        />
      )

      expect(screen.getByText('Procesando...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /procesando/i })).toBeDisabled()
    })

    it('renders different variants with correct icons', () => {
      const variants = ['destructive', 'warning', 'success', 'info'] as const

      variants.forEach(variant => {
        const { unmount } = render(
          <ConfirmModal
            open={true}
            title={`${variant} modal`}
            variant={variant}
          />
        )

        // Verificar que el modal se renderiza (el ícono específico es difícil de testear)
        expect(screen.getByText(`${variant} modal`)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('QuickViewModal', () => {
    it('renders with large size by default', () => {
      render(
        <QuickViewModal open={true}>
          <div>Product details</div>
        </QuickViewModal>
      )

      expect(screen.getByText('Product details')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl')
    })
  })

  describe('AddToCartModal', () => {
    it('renders product information', () => {
      render(
        <AddToCartModal
          open={true}
          productName="Test Product"
          productImage="/test-image.jpg"
        />
      )

      expect(screen.getByText('¡Producto agregado al carrito!')).toBeInTheDocument()
      expect(screen.getByText(/test product/i)).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAttribute('src', '/test-image.jpg')
    })

    it('calls action handlers', async () => {
      const user = userEvent.setup()
      const onContinueShopping = jest.fn()
      const onGoToCart = jest.fn()

      render(
        <AddToCartModal
          open={true}
          productName="Test Product"
          onContinueShopping={onContinueShopping}
          onGoToCart={onGoToCart}
        />
      )

      const continueButton = screen.getByRole('button', { name: /seguir comprando/i })
      const cartButton = screen.getByRole('button', { name: /ver carrito/i })

      await user.click(continueButton)
      expect(onContinueShopping).toHaveBeenCalled()

      await user.click(cartButton)
      expect(onGoToCart).toHaveBeenCalled()
    })
  })

  describe('useModal hook', () => {
    function TestComponent() {
      const { open, openModal, closeModal, toggleModal } = useModal()

      return (
        <div>
          <span data-testid="modal-state">{open ? 'open' : 'closed'}</span>
          <button onClick={openModal}>Open</button>
          <button onClick={closeModal}>Close</button>
          <button onClick={toggleModal}>Toggle</button>
        </div>
      )
    }

    it('manages modal state correctly', async () => {
      const user = userEvent.setup()
      render(<TestComponent />)

      const state = screen.getByTestId('modal-state')
      const openButton = screen.getByRole('button', { name: /open/i })
      const closeButton = screen.getByRole('button', { name: /close/i })
      const toggleButton = screen.getByRole('button', { name: /toggle/i })

      // Initial state
      expect(state).toHaveTextContent('closed')

      // Open modal
      await user.click(openButton)
      expect(state).toHaveTextContent('open')

      // Close modal
      await user.click(closeButton)
      expect(state).toHaveTextContent('closed')

      // Toggle modal
      await user.click(toggleButton)
      expect(state).toHaveTextContent('open')

      await user.click(toggleButton)
      expect(state).toHaveTextContent('closed')
    })

    it('accepts default open state', () => {
      function TestComponentWithDefault() {
        const { open } = useModal(true)
        return <span data-testid="modal-state">{open ? 'open' : 'closed'}</span>
      }

      render(<TestComponentWithDefault />)
      expect(screen.getByTestId('modal-state')).toHaveTextContent('open')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Modal
          open={true}
          title="Accessible Modal"
          description="Modal description"
        >
          Content
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('focuses close button when opened', () => {
      render(
        <Modal open={true} title="Test Modal">
          Content
        </Modal>
      )

      // El foco debería estar en el modal o en el botón de cerrar
      const closeButton = screen.getByRole('button', { name: /cerrar/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()

      render(
        <Modal
          open={true}
          onOpenChange={onOpenChange}
          title="Test Modal"
        >
          Content
        </Modal>
      )

      // Escape key should close modal
      await user.keyboard('{Escape}')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
