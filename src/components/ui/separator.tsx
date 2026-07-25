interface SeparatorProps {
  className?: string
}

export function Separator({ className = '' }: SeparatorProps) {
  return <div className={`border-t border-outline-variant/30 ${className}`} />
}
