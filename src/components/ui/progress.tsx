interface ProgressProps {
  value: number
  className?: string
  color?: string
}

export function Progress({ value, className = '', color = 'bg-primary' }: ProgressProps) {
  return (
    <div className={`h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
