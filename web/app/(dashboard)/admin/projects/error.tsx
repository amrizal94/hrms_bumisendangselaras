'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/admin/projects] Uncaught error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || 'An unexpected error occurred loading the Projects page.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
