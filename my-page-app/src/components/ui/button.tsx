import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'

import cn from '@/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

/*
 * Button component fetched from
 * https://ui.shadcn.com/docs/components/button
 *
 * Styled with daisyui button classes
 */

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: '',
      primary: 'btn-primary',
      error: 'btn-error text-white',
      outline: 'btn-outline',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      link: 'btn-link',
      avatar: '',
    },
    size: {
      default: '',
      sm: 'btn-sm',
      lg: 'btn-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
