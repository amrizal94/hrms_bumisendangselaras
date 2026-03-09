'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { useCreateProject, useUpdateProject } from '@/hooks/use-tasks'
import type { Project } from '@/types/task'

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
}

// Inner form — initialized from props on every mount, so no useEffect needed.
// The parent passes `key` that changes when the dialog opens, ensuring fresh state.
function ProjectFormInner({
  project,
  onClose,
}: {
  project?: Project | null
  onClose: () => void
}) {
  const [name, setName]               = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus]           = useState<string>(project?.status ?? 'active')
  const [deadline, setDeadline]       = useState(project?.deadline ?? '')

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const isPending     = createProject.isPending || updateProject.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      status: status as 'active' | 'completed' | 'archived',
      deadline: deadline || undefined,
    }
    if (project) {
      updateProject.mutate({ id: project.id, data }, { onSuccess: onClose })
    } else {
      createProject.mutate(data, { onSuccess: onClose })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="proj-name">Name *</Label>
        <Input
          id="proj-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="proj-desc">Description</Label>
        <Textarea
          id="proj-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="proj-deadline">Deadline</Label>
          <Input
            id="proj-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? 'Saving…' : project ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        {open && (
          <ProjectFormInner
            key={project?.id ?? 'new'}
            project={project}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
