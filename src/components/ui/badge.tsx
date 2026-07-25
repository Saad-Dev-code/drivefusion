import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-variant text-on-surface-variant',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-primary/10 text-primary',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}
