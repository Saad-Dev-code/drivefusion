import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-[24px] premium-shadow border border-white/40 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return <div className={`p-8 ${className}`} {...props}>{children}</div>
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return <div className={`px-8 pb-8 ${className}`} {...props}>{children}</div>
}

export function CardFooter({ className = '', children, ...props }: CardProps) {
  return <div className={`px-8 pb-8 flex items-center gap-4 ${className}`} {...props}>{children}</div>
}
