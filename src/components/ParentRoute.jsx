import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/lib/auth'

export default function ParentRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    )
  }

  if (user?.account_type !== 'PARENT') return <Navigate to="/tableau-de-bord" replace />
  return <Outlet />
}
