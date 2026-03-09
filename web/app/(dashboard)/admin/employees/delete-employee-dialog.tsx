'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteEmployee } from '@/hooks/use-employees'
import type { Employee } from '@/types/employee'

interface Props {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
}

export function DeleteEmployeeDialog({ employee, onOpenChange }: Props) {
  const deleteMutation = useDeleteEmployee()

  function handleConfirm() {
    if (!employee) return
    deleteMutation.mutate(employee.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={!!employee} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">{employee?.user.name}</span>{' '}
            ({employee?.employee_number})? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
