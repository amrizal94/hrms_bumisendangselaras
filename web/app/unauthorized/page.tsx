import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <ShieldX className="h-16 w-16 text-red-400 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500">You don&apos;t have permission to access this page.</p>
        <Button asChild variant="outline">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  )
}
