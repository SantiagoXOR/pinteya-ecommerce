import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button'
import { badgeVariants } from './badge'

// Button types
export type ButtonVariant = VariantProps<typeof buttonVariants>
export type ButtonSize = NonNullable<ButtonVariant['size']>
export type ButtonVariantType = NonNullable<ButtonVariant['variant']>

// Badge types
export type BadgeVariant = VariantProps<typeof badgeVariants>
export type BadgeVariantType = NonNullable<BadgeVariant['variant']>

// Common UI types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  loadingText?: string
}

export interface ErrorState {
  error?: string | null
  hasError: boolean
}

export interface AsyncState extends LoadingState, ErrorState {
  data?: unknown
}

// Form types
export interface FormFieldProps extends BaseComponentProps {
  label?: string
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// Table types
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string
  title: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: unknown, record: T, index: number) => React.ReactNode
}

export interface TableProps<T = Record<string, unknown>> extends BaseComponentProps {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowKey?: keyof T | ((record: T) => string)
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
}

// Modal types
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  title?: string
  footer?: React.ReactNode
  width?: string | number
  closable?: boolean
  maskClosable?: boolean
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationProps {
  type: NotificationType
  title: string
  message?: string
  duration?: number
  onClose?: () => void
}

// Theme types
export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
}

export interface ThemeConfig {
  colors: ThemeColors
  borderRadius: string
  fontFamily: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
}

// Animation types
export type AnimationType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'bounce'

export interface AnimationProps {
  type?: AnimationType
  duration?: number
  delay?: number
  easing?: string
}

// Responsive types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface ResponsiveValue<T> {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}

// Component state types
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ComponentVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled' | 'loading'

// Event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void
export type ChangeHandler<T = any> = (value: T) => void
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void
export type KeyboardHandler = (event: React.KeyboardEvent<HTMLElement>) => void

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// Re-export common React types
export type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementRef,
  HTMLAttributes,
  ReactNode,
  ReactElement,
  FC,
  PropsWithChildren,
} from 'react'
