import { useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Menu,
  MessageSquare,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const features = [
  {
    icon: GraduationCap,
    title: 'Élèves et classes',
    description: 'Centralisez les dossiers des élèves, les classes et les informations utiles à votre équipe.',
  },
  {
    icon: CalendarDays,
    title: 'Présences et suivi scolaire',
    description: 'Suivez les présences, les résultats, les devoirs et l’emploi du temps depuis le même espace.',
  },
  {
    icon: MessageSquare,
    title: 'Communication avec les familles',
    description: 'Préparez et suivez les messages destinés aux parents, selon les canaux configurés par l’école.',
  },
  {
    icon: WalletCards,
    title: 'Suivi des frais scolaires',
    description: 'Consultez les frais, les paiements saisis et les soldes des élèves.',
  },
]

const audiences = [
  {
    icon: BookOpenCheck,
    title: 'Pour la direction et le personnel',
    description: 'Gérez les informations de l’établissement et retrouvez les outils scolaires dans un espace organisé.',
  },
  {
    icon: Users,
    title: 'Pour les familles',
    description: 'Donnez aux parents un accès dédié aux informations de leurs enfants lorsque leur compte est activé.',
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0 text-xl font-display font-semibold" onClick={closeMenu}>
            <span className="text-primary-900 dark:text-primary-100">School</span>
            <span className="text-accent-600">Connect</span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
            <a href="#accueil" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Accueil</a>
            <a href="#fonctionnalites" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#ecoles" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Écoles</a>
            <a href="#familles" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Familles</a>
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/connexion">Connexion</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/inscription">Créer un compte</Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {menuOpen && (
          <nav id="menu-mobile" aria-label="Navigation mobile" className="border-t border-border bg-background px-4 py-4 sm:px-6 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a href="#accueil" onClick={closeMenu} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Accueil</a>
              <a href="#fonctionnalites" onClick={closeMenu} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Fonctionnalités</a>
              <a href="#ecoles" onClick={closeMenu} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Écoles</a>
              <a href="#familles" onClick={closeMenu} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Familles</a>
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <Link to="/connexion" onClick={closeMenu}>Connexion</Link>
                </Button>
                <Button asChild>
                  <Link to="/inscription" onClick={closeMenu}>Créer un compte</Link>
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="accueil" className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              Une plateforme pensée pour les établissements scolaires
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              L’école mieux organisée, les familles mieux informées.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              SchoolConnect rassemble les outils de gestion scolaire et facilite le suivi des élèves ainsi que les échanges avec les familles.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/inscription">
                  Créer l’espace de mon école <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/connexion">J’ai déjà un compte</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">L’inscription permet de créer l’espace de votre établissement.</p>
          </div>

          <div aria-label="Aperçu des outils SchoolConnect" className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 -top-4 size-24 rounded-full bg-accent-100/70 blur-2xl sm:-left-8 sm:-top-8 sm:size-36" />
            <div className="relative rounded-3xl bg-primary-950 p-5 text-white shadow-2xl sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-5">
                <div>
                  <p className="text-sm text-white/65">Votre établissement</p>
                  <p className="mt-1 text-xl font-semibold">Un espace, plusieurs outils</p>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-500">
                  <GraduationCap className="size-6" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {features.map(({ icon: Icon, title }) => (
                  <div key={title} className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-500">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-sm font-medium leading-5">{title}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-white/60">Les services de communication dépendent de la configuration de chaque établissement.</p>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="scroll-mt-24 border-y border-border bg-muted/40 py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Fonctionnalités</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Les outils essentiels au même endroit</h2>
              <p className="mt-3 text-muted-foreground">Une vue plus claire des activités de l’établissement, de la classe jusqu’aux échanges avec les familles.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8">
          <div id="ecoles" className="scroll-mt-24">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Un outil pour votre établissement</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Chaque équipe retrouve ses repères.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Les responsables et le personnel disposent d’un espace pour gérer les informations de l’école et suivre les activités du quotidien.</p>
          </div>
          <div id="familles" className="scroll-mt-24 grid gap-4 sm:grid-cols-2">
            {audiences.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-border p-5">
                <Icon className="size-6 text-primary-700" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-primary-950 px-6 py-8 text-white sm:px-10 sm:py-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Prêt à découvrir SchoolConnect ?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Créez l’espace de votre établissement ou connectez-vous si vous avez déjà un compte.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild variant="secondary">
                <Link to="/inscription">Créer un compte</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/connexion">Connexion</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-foreground">SchoolConnect</span>
          <span>La gestion scolaire et la communication avec les familles.</span>
        </div>
      </footer>
    </div>
  )
}
