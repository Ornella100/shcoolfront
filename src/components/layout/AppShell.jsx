import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  BookOpenCheck,
  Clock,
  ShieldAlert,
  ClipboardList,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Receipt,
  WalletCards,
  Upload,
  UserCog,
  Users,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import AnneeSelector from '@/components/AnneeSelector'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/eleves-classes', label: 'Élèves & classes', icon: GraduationCap },
  { to: '/enseignants', label: 'Enseignants', icon: UserRound },
  { to: '/annees', label: 'Années scolaires', icon: CalendarDays },
  { to: '/presences', label: 'Présences', icon: ClipboardCheck },
  { to: '/notes-bulletins', label: 'Notes & bulletins', icon: BookOpenCheck },
  { to: '/emploi-du-temps', label: 'Emploi du temps', icon: Clock },
  { to: '/discipline', label: 'Discipline', icon: ShieldAlert },
  { to: '/devoirs', label: 'Devoirs & travaux', icon: ClipboardList },
  { to: '/rapports', label: 'Rapports', icon: BarChart3 },
  { to: '/frais-scolaires', label: 'Frais scolaires', icon: WalletCards },
  { to: '/parents', label: 'Parents', icon: Users },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/facturation', label: 'Facturation', icon: Receipt },
]
const parentNavItems = [
  { to: '/portail-parent', label: 'Espace famille', icon: Users, end: true },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Le compte AfriLab (superuser, sans école) ne gère aucune école en particulier :
  // il n'a accès qu'à la liste des écoles clientes, jamais aux pages opérationnelles.
  const items = user?.is_superuser
    ? [{ to: '/admin/ecoles', label: 'Écoles clientes', icon: Building2 }]
    : user?.account_type === 'PARENT'
      ? parentNavItems
      : navItems

  async function handleLogout() {
    setMobileMenuOpen(false)
    try {
      await logout()
    } catch {
      // onSettled efface la session locale même si l'appel serveur échoue.
    } finally {
      navigate('/connexion', { replace: true })
    }
  }

  const renderSidebar = (onNavigate) => (
    <>
      <div className="px-6 py-5">
        <span className="text-xl font-display font-semibold">
          School<span className="text-accent-500">Connect</span>
        </span>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary-700 text-neutral-0'
                  : 'text-neutral-0/70 hover:bg-primary-800 hover:text-neutral-0'
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 px-3 pb-5 pt-3">
        <NavLink
          to="/profil"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary-700 text-neutral-0'
                : 'text-neutral-0/70 hover:bg-primary-800 hover:text-neutral-0'
            )
          }
        >
          <UserCog className="size-4 shrink-0" />
          Mon profil
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-0/70 transition-colors hover:bg-primary-800 hover:text-neutral-0"
        >
          <LogOut className="size-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-svh w-full min-w-0 bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-primary-900 text-neutral-0 lg:flex">
        {renderSidebar()}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer le menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside role="dialog" aria-modal="true" aria-label="Menu principal" className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-primary-900 text-neutral-0 shadow-xl">
            {renderSidebar(() => setMobileMenuOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-3 sm:flex-nowrap sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-xl">
                Bonjour, {user?.first_name || user?.username}
              </h1>
              {user?.school?.name && (
                <p className="truncate text-sm text-muted-foreground">{user.school.name}</p>
              )}
            </div>
          </div>
          <div className="ml-auto flex max-w-full items-center gap-2 sm:gap-3">
            {user?.account_type !== 'PARENT' && <AnneeSelector />}
            <Button variant="ghost" size="icon">
              <Bell className="size-4" />
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
