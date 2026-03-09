import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/task'

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  todo:        { label: 'To Do',       className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  done:        { label: 'Done',        className: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-100 text-red-700' },
}

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.todo
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', style.className, className)}>
      {style.label}
    </span>
  )
}
