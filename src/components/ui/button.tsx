'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-[16px] font-semibold premium-shadow hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all',
  secondary: 'bg-primary-container text-on-primary-container rounded-[16px] font-semibold hover:opacity-90 active:scale-95 transition-all',
  ghost: 'text-on-surface-variant hover:bg-surface-container-high rounded-[16px] font-semibold active:scale-95 transition-all',
  outline: 'border border-outline-variant/30 text-on-surface rounded-[16px] font-semibold hover:bg-surface-container-low active:scale-95 transition-all',
  danger: 'bg-error-container text-on-error-container rounded-[16px] font-semibold hover:opacity-90 active:scale-95 transition-all',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-body-sm',
  md: 'px-6 py-3 text-body-sm',
  lg: 'px-8 py-4 text-body',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
