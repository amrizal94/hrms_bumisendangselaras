import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/types/task'

const PRIORITY_STYLES: Record<TaskPriority, { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  high:   { label: 'High',   className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
}

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', style.className, className)}>
      {style.label}
    </span>
  )
}
