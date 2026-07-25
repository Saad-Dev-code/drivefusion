'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className = '', ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {icon && (
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full ${icon ? 'pl-14' : 'pl-6'} pr-6 py-4 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-body font-medium placeholder:text-outline transition-all outline-none ${className}`}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
