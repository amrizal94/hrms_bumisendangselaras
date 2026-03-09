'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmitExpense, useExpenseTypes } from '@/hooks/use-expenses'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitExpenseDialog({ open, onOpenChange }: Props) {
  const mutation   = useSubmitExpense()
  const fileRef    = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  const { data: expenseTypes = [], isLoading: typesLoading } = useExpenseTypes()

  const [form, setForm] = useState({
    expense_date:    '',
    amount:          '',
    expense_type_id: '',
    description:     '',
  })

  function reset() {
    setForm({ expense_date: '', amount: '', expense_type_id: '', description: '' })
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    const fd = new FormData()
    fd.append('expense_date',    form.expense_date)
    fd.append('amount',          form.amount)
    fd.append('expense_type_id', form.expense_type_id)
    fd.append('description',     form.description)
    fd.append('receipt',         file)

    mutation.mutate(fd, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!mutation.isPending) { reset(); onOpenChange(v) } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                required
                value={form.expense_date}
                onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Amount (Rp)</Label>
              <Input
                type="number"
                min={1}
                required
                placeholder="50000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              required
              value={form.expense_type_id}
              onValueChange={(v) => setForm((f) => ({ ...f, expense_type_id: v }))}
              disabled={typesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={typesLoading ? 'Loading…' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              required
              placeholder="Describe the expense..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>Receipt (JPG / PNG / PDF, max 5 MB)</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {fileName
                ? <p className="text-sm font-medium">{fileName}</p>
                : <p className="text-sm text-muted-foreground">Click to upload receipt</p>
              }
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.expense_type_id}>
              {mutation.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
