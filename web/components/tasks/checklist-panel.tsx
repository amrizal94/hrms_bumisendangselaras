'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAddChecklistItem, useDeleteChecklistItem, useToggleChecklistItem } from '@/hooks/use-tasks'
import type { ChecklistItem } from '@/types/task'

interface ChecklistPanelProps {
  taskId: number
  items: ChecklistItem[]
  isAdmin?: boolean
}

export function ChecklistPanel({ taskId, items, isAdmin = false }: ChecklistPanelProps) {
  const [newTitle, setNewTitle]       = useState('')
  const [localItems, setLocalItems]   = useState<ChecklistItem[]>(items)
  const pendingCount                  = useRef(0)

  // Sync with server data only when no toggle is in-flight (avoid overwriting optimistic state).
  useEffect(() => {
    if (pendingCount.current === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalItems(items)
    }
  }, [items])

  const addItem    = useAddChecklistItem(taskId)
  const toggleItem = useToggleChecklistItem()
  const deleteItem = useDeleteChecklistItem(taskId)

  const done  = localItems.filter((i) => i.is_done).length
  const total = localItems.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  function handleToggle(item: ChecklistItem) {
    // Flip immediately — no waiting for network
    setLocalItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, is_done: !i.is_done } : i)
    )
    pendingCount.current++
    toggleItem.mutate(
      { taskId, itemId: item.id },
      {
        onSuccess: () => { pendingCount.current-- },
        onError: () => {
          pendingCount.current--
          // Revert this item back on failure
          setLocalItems((prev) =>
            prev.map((i) => i.id === item.id ? { ...i, is_done: item.is_done } : i)
          )
        },
      }
    )
  }

  function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    addItem.mutate(title, { onSuccess: () => setNewTitle('') })
  }

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
        </div>
      )}

      <ul className="space-y-1">
        {localItems.map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              id={`item-${item.id}`}
              checked={item.is_done}
              onChange={() => handleToggle(item)}
              className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
            />
            <label
              htmlFor={`item-${item.id}`}
              className={`flex-1 text-sm cursor-pointer select-none transition-colors ${
                item.is_done ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {item.title}
            </label>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteItem.mutate(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div className="flex gap-2">
          <Input
            placeholder="Add item…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleAdd} disabled={addItem.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
