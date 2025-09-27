import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox, CheckboxGroup } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectField, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormSection, FormRow, useForm } from '@/components/ui/form'

// Mock para Radix UI
jest.mock('@radix-ui/react-checkbox', () => ({
  ...jest.requireActual('@radix-ui/react-checkbox'),
  Root: ({ children, onCheckedChange, checked, ...props }: any) => (
    <div>
      <input
        type='checkbox'
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      {children}
    </div>
  ),
  Indicator: ({ children }: any) => <span>{children}</span>,
}))

jest.mock('@radix-ui/react-radio-group', () => ({
  ...jest.requireActual('@radix-ui/react-radio-group'),
  Root: ({ children, onValueChange, value, ...props }: any) => (
    <div role='radiogroup' {...props}>
      {children}
    </div>
  ),
  Item: ({ children, value, ...props }: any) => (
    <div>
      <input type='radio' value={value} {...props} />
      {children}
    </div>
  ),
  Indicator: ({ children }: any) => <span>{children}</span>,
}))

describe('Form Components', () => {
  describe('Checkbox', () => {
    it('renders with label and description', () => {
      render(<Checkbox label='Accept terms' description='Please read our terms and conditions' />)

      expect(screen.getByText('Accept terms')).toBeInTheDocument()
      expect(screen.getByText('Please read our terms and conditions')).toBeInTheDocument()
    })

    it('shows required indicator', () => {
      render(<Checkbox label='Required field' required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('displays error message', () => {
      render(<Checkbox label='Field' error='This field is required' />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('calls onCheckedChange when clicked', async () => {
      const user = userEvent.setup()
      const onCheckedChange = jest.fn()

      render(<Checkbox label='Test checkbox' onCheckedChange={onCheckedChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(onCheckedChange).toHaveBeenCalledWith(true)
    })
  })

  describe('CheckboxGroup', () => {
    it('renders group with label and description', () => {
      render(
        <CheckboxGroup label='Preferences' description='Select your preferences'>
          <Checkbox label='Option 1' />
          <Checkbox label='Option 2' />
        </CheckboxGroup>
      )

      expect(screen.getByText('Preferences')).toBeInTheDocument()
      expect(screen.getByText('Select your preferences')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('displays error message', () => {
      render(
        <CheckboxGroup error='Please select at least one option'>
          <Checkbox label='Option 1' />
        </CheckboxGroup>
      )

      expect(screen.getByText('Please select at least one option')).toBeInTheDocument()
    })
  })

  describe('RadioGroup', () => {
    it('renders with label and items', () => {
      render(
        <RadioGroup label='Choose option'>
          <RadioGroupItem value='option1' label='Option 1' />
          <RadioGroupItem value='option2' label='Option 2' />
        </RadioGroup>
      )

      expect(screen.getByText('Choose option')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('shows required indicator', () => {
      render(
        <RadioGroup label='Required choice' required>
          <RadioGroupItem value='option1' label='Option 1' />
        </RadioGroup>
      )

      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('Textarea', () => {
    it('renders with label and placeholder', () => {
      render(<Textarea label='Message' placeholder='Enter your message' />)

      expect(screen.getByText('Message')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument()
    })

    it('shows character count when enabled', () => {
      render(<Textarea showCharCount maxLength={100} defaultValue='Hello' />)

      // El componente muestra el contador de caracteres
      expect(screen.getByText(/\/100/)).toBeInTheDocument()
    })

    it('displays error message', () => {
      render(<Textarea label='Message' error='Message is required' />)
      expect(screen.getByText('Message is required')).toBeInTheDocument()
    })

    it('enforces max length', async () => {
      const user = userEvent.setup()

      render(<Textarea maxLength={5} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'This is a long message')

      expect(textarea).toHaveValue('This ')
    })
  })

  describe('Form Structure', () => {
    it('renders form with sections and rows', () => {
      render(
        <Form>
          <FormSection title='Personal Info' description='Your details'>
            <FormRow columns={2}>
              <div>Field 1</div>
              <div>Field 2</div>
            </FormRow>
          </FormSection>
        </Form>
      )

      expect(screen.getByText('Personal Info')).toBeInTheDocument()
      expect(screen.getByText('Your details')).toBeInTheDocument()
      expect(screen.getByText('Field 1')).toBeInTheDocument()
      expect(screen.getByText('Field 2')).toBeInTheDocument()
    })
  })

  describe('useForm hook', () => {
    function TestForm() {
      const { values, errors, handleSubmit, register } = useForm({
        defaultValues: { name: '', email: '' },
        validate: data => {
          const errors: Record<string, string> = {}
          if (!data.name) {
            errors.name = 'Name required'
          }
          if (!data.email) {
            errors.email = 'Email required'
          }
          return Object.keys(errors).length > 0 ? errors : null
        },
        onSubmit: data => {
          console.log('Submitted:', data)
        },
      })

      return (
        <form onSubmit={handleSubmit}>
          <input placeholder='Name' {...register('name')} />
          {errors.name && <span>{errors.name}</span>}

          <input placeholder='Email' {...register('email')} />
          {errors.email && <span>{errors.email}</span>}

          <button type='submit'>Submit</button>
        </form>
      )
    }

    it('handles form validation', async () => {
      const user = userEvent.setup()
      render(<TestForm />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      expect(screen.getByText('Name required')).toBeInTheDocument()
      expect(screen.getByText('Email required')).toBeInTheDocument()
    })

    it('clears errors when user types', async () => {
      const user = userEvent.setup()
      render(<TestForm />)

      // Submit to show errors
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      expect(screen.getByText('Name required')).toBeInTheDocument()

      // Type in name field
      const nameInput = screen.getByPlaceholderText('Name')
      await user.type(nameInput, 'John')

      expect(screen.queryByText('Name required')).not.toBeInTheDocument()
    })

    it('updates values when user types', async () => {
      const user = userEvent.setup()
      render(<TestForm />)

      const nameInput = screen.getByPlaceholderText('Name')
      await user.type(nameInput, 'John Doe')

      expect(nameInput).toHaveValue('John Doe')
    })
  })

  describe('Accessibility', () => {
    it('checkbox has proper labels', () => {
      render(<Checkbox label='Accept terms' id='terms' />)

      const checkbox = screen.getByRole('checkbox')
      const label = screen.getByText('Accept terms')

      expect(checkbox).toHaveAttribute('id', 'terms')
      expect(label).toHaveAttribute('for', 'terms')
    })

    it('radio group has proper structure', () => {
      render(
        <RadioGroup label='Choose option'>
          <RadioGroupItem value='option1' label='Option 1' />
          <RadioGroupItem value='option2' label='Option 2' />
        </RadioGroup>
      )

      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })

    it('textarea has proper labeling', () => {
      render(<Textarea label='Message' id='message' />)

      const textarea = screen.getByRole('textbox')
      const label = screen.getByText('Message')

      expect(textarea).toHaveAttribute('id', 'message')
      expect(label).toHaveAttribute('for', 'message')
    })

    it('form fields support required attribute', () => {
      render(
        <div>
          <Checkbox label='Required checkbox' required />
          <Textarea label='Required textarea' required />
        </div>
      )

      expect(screen.getAllByText('*')).toHaveLength(2)
    })
  })

  describe('Error States', () => {
    it('shows error styling for invalid fields', () => {
      render(
        <div>
          <Checkbox label='Field' error='Error message' />
          <Textarea label='Field' error='Error message' />
        </div>
      )

      expect(screen.getAllByText('Error message')).toHaveLength(2)
    })

    it('applies error variant to components', () => {
      render(<Textarea variant='error' />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('border-red-500')
    })
  })
})
