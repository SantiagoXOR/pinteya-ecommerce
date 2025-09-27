'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible')
  }
  return context
}

interface CollapsibleProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    { open: controlledOpen, defaultOpen = false, onOpenChange, children, className, ...props },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        if (!isControlled) {
          setInternalOpen(newOpen)
        }
        onOpenChange?.(newOpen)
      },
      [isControlled, onOpenChange]
    )

    const contextValue = React.useMemo(
      () => ({ open, onOpenChange: handleOpenChange }),
      [open, handleOpenChange]
    )

    return (
      <CollapsibleContext.Provider value={contextValue}>
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = 'Collapsible'

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild = false, children, onClick, ...props }, ref) => {
    const { open, onOpenChange } = useCollapsible()

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onOpenChange(!open)
        onClick?.(event)
      },
      [open, onOpenChange, onClick]
    )

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        ...props,
        ref,
        onClick: handleClick,
        'aria-expanded': open,
        'data-state': open ? 'open' : 'closed',
      })
    }

    return (
      <button
        ref={ref}
        type='button'
        aria-expanded={open}
        data-state={open ? 'open' : 'closed'}
        onClick={handleClick}
        className={cn(
          'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          props.className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ forceMount, children, className, ...props }, ref) => {
    const { open } = useCollapsible()
    const [isPresent, setIsPresent] = React.useState(open)

    React.useEffect(() => {
      if (open) {
        setIsPresent(true)
      } else {
        const timer = setTimeout(() => setIsPresent(false), 150) // Animation duration
        return () => clearTimeout(timer)
      }
    }, [open])

    if (!forceMount && !isPresent) {
      return null
    }

    return (
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'overflow-hidden text-sm transition-all',
          open ? 'animate-collapsible-down' : 'animate-collapsible-up',
          className
        )}
        {...props}
      >
        <div className='pb-4 pt-0'>{children}</div>
      </div>
    )
  }
)
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
