import type { Label } from '@/types/task'

interface LabelBadgeProps {
  label: Label
  className?: string
}

export function LabelBadge({ label, className }: LabelBadgeProps) {
  const hex = label.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className ?? ''}`}
      style={{
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
        color: label.color,
      }}
    >
      {label.name}
    </span>
  )
}
