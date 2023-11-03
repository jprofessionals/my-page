'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'

import cn from '@/utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faX } from '@fortawesome/free-solid-svg-icons'
import {
  ComponentPropsWithoutRef,
  ElementRef,
  HTMLAttributes,
  forwardRef,
} from 'react'

const Modal = DialogPrimitive.Root
const Trigger = DialogPrimitive.Trigger
const Close = DialogPrimitive.Close

/*
 * Modal component. In radix-ui it is known as 'Dialog', but Modal is a more
 * common name for this component.
 *
 * With this component we are simply importing primitives from
 * Radix-ui, applying our own styling with Tailwind and re-exporting for re-use.
 *
 * Documentation: https://ui.shadcn.com/docs/components/dialog
 *
 */

const Portal = DialogPrimitive.Portal

const Overlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm transition-all duration-100 data-closed:animate-out data-closed:fade-out data-open:fade-in',
      className,
    )}
    {...props}
  />
))
Overlay.displayName = DialogPrimitive.Overlay.displayName

const Content = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showX?: boolean }
>(({ className, children, showX: showClose, ...props }, ref) => (
  <Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 grid gap-4 rounded-b-lg border bg-white p-6 shadow-lg animate-in data-open:fade-in-90 data-open:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-open:sm:slide-in-from-bottom-0',
        className,
      )}
      {...props}
    >
      {children}
      {showClose ? (
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none ring-offset-background data-open:bg-accent data-open:text-muted-foreground focus:ring-ring">
          <FontAwesomeIcon icon={faX} className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </Portal>
))
Content.displayName = DialogPrimitive.Content.displayName

const Header = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
)
Header.displayName = 'DialogHeader'

const Footer = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
)
Footer.displayName = 'DialogFooter'

const Title = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
))
Title.displayName = DialogPrimitive.Title.displayName

const Description = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
Description.displayName = DialogPrimitive.Description.displayName

export { Modal, Trigger, Close, Content, Header, Footer, Title, Description }
