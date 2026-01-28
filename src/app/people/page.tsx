import { Users } from 'lucide-react'

export default function PeoplePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">People</h2>
      <p className="text-muted-foreground max-w-md">
        Team directory coming soon. Manage team members, assign tasks, and track workloads.
      </p>
    </div>
  )
}
