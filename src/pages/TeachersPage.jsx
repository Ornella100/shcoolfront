import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchSubjects } from '@/lib/results-api'
import { createTeacher, deleteTeacher, fetchTeachers, updateTeacher } from '@/lib/teachers-api'

const EMPTY_FORM = {
  first_name: '', last_name: '', phone_number: '', email: '', specialty: '',
  subjects: [], hire_date: '', is_active: true,
}

export default function TeachersPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: () => fetchTeachers({ search }),
  })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function beginEdit(teacher) {
    setEditingId(teacher.id)
    setForm({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone_number: teacher.phone_number || '',
      email: teacher.email || '',
      specialty: teacher.specialty || '',
      subjects: teacher.subjects.map(String),
      hire_date: teacher.hire_date || '',
      is_active: teacher.is_active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, subjects: form.subjects.map(Number), hire_date: form.hire_date || null }
      return editingId ? updateTeacher(editingId, payload) : createTeacher(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      resetForm()
      toast.success(editingId ? 'Fiche enseignant mise à jour' : 'Enseignant ajouté')
    },
    onError: (error) => {
      const details = error?.response?.data
      const message = Object.values(details || {}).flat(Infinity).find((value) => typeof value === 'string')
      toast.error(message || 'Impossible d’enregistrer cet enseignant')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
      toast.success('Enseignant supprimé')
    },
    onError: () => toast.error('Impossible de supprimer cet enseignant'),
  })

  function toggleSubject(subjectId) {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.includes(String(subjectId))
        ? current.subjects.filter((id) => id !== String(subjectId))
        : [...current.subjects, String(subjectId)],
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Enseignants</h2>
        <p className="text-sm text-muted-foreground">Gérez les coordonnées, matières et affectations des enseignants de votre école.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Modifier la fiche' : 'Ajouter un enseignant'}</CardTitle>
          <CardDescription>Les enseignants pourront être affectés aux cours de l’emploi du temps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><label className="text-sm font-medium">Prénom *</label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} maxLength={100} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Nom *</label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} maxLength={100} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Téléphone</label><Input type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} maxLength={20} placeholder="+229…" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">E-mail</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Spécialité</label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} maxLength={100} placeholder="Ex. Mathématiques" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Date d’embauche</label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Matières enseignées</p>
            {subjects.length === 0 ? <p className="text-sm text-muted-foreground">Crée d’abord les matières dans « Notes & bulletins ».</p> : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => {
                  const selected = form.subjects.includes(String(subject.id))
                  return <button key={subject.id} type="button" onClick={() => toggleSubject(subject.id)} aria-pressed={selected} className={`rounded-full border px-3 py-1.5 text-sm ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>{subject.name}</button>
                })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.first_name.trim() || !form.last_name.trim() || saveMutation.isPending}>
              {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {saveMutation.isPending ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Ajouter l’enseignant'}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}><X className="size-4" />Annuler</Button>}
            {editingId && <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Enseignant actif</label>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div><CardTitle>Annuaire</CardTitle><CardDescription>{teachers.length} enseignant(s)</CardDescription></div>
          <Input className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, téléphone, e-mail…" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : teachers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"><UserRound className="mx-auto mb-2 size-8" />Aucun enseignant trouvé.</div>
          ) : teachers.map((teacher) => (
            <article key={teacher.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{teacher.first_name} {teacher.last_name}</h3><Badge variant={teacher.is_active ? 'secondary' : 'outline'}>{teacher.is_active ? 'Actif' : 'Inactif'}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{[teacher.specialty, teacher.phone_number, teacher.email].filter(Boolean).join(' · ') || 'Aucune coordonnée renseignée'}</p>
                <div className="mt-2 flex flex-wrap gap-1">{teacher.subject_names.map((name) => <Badge key={name} variant="outline">{name}</Badge>)}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => beginEdit(teacher)}><Pencil className="size-4" />Modifier</Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer la fiche" onClick={() => { if (window.confirm(`Supprimer la fiche de ${teacher.first_name} ${teacher.last_name} ?`)) deleteMutation.mutate(teacher.id) }} disabled={deleteMutation.isPending}><Trash2 className="size-4 text-error-600" /></Button>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
