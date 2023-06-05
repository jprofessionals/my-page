import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper function for cleaning out duplicate classnames
export default function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
