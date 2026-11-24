import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAnnee } from '@/lib/annee'
import { fetchSubjects } from '@/lib/results-api'
import { createScheduleSlot, deleteScheduleSlot, fetchTimetable } from '@/lib/timetable-api'
import { fetchTeachers } from '@/lib/teachers-api'
import { fetchClasses } from '@/lib/schools-api'

const WEEKDAYS = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche',
]

const INITIAL_FORM = {
  subject: '',
  weekday: '0',
  start_time: '08:00',
  end_time: '09:00',
  teacher_name: '',
  teacher: 'NONE',
  room: '',
}

export default function TimetablePage() {
  const queryClient = useQueryClient()
  const { annee, anneeId } = useAnnee()
  const [classeId, setClasseId] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: () => fetchClasses(undefined, anneeId),
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', 'active'],
    queryFn: () => fetchTeachers({ active: true }),
  })
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['timetable', classeId, anneeId],
    queryFn: () => fetchTimetable(classeId, anneeId),
    enabled: Boolean(classeId && anneeId),
  })

  const createMutation = useMutation({
    mutationFn: () => createScheduleSlot({
      ...form,
      classroom: Number(classeId),
      subject: Number(form.subject),
      weekday: Number(form.weekday),
      teacher: form.teacher === 'NONE' ? null : Number(form.teacher),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classeId, anneeId] })
      setForm((current) => ({ ...current, teacher_name: '', teacher: 'NONE', room: '' }))
      toast.success('Créneau ajouté à l’emploi du temps')
    },
    onError: (error) => {
      const detail = error?.response?.data
      const message = detail?.start_time || detail?.end_time || detail?.detail
      toast.error(typeof message === 'string' ? message : 'Créneau en conflit ou données invalides')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScheduleSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classeId, anneeId] })
      toast.success('Créneau supprimé')
    },
    onError: () => toast.error('Impossible de supprimer le créneau'),
  })

  const slotsByDay = WEEKDAYS.map((label, weekday) => ({
    label,
    slots: slots.filter((slot) => slot.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Emploi du temps</h2>
        <p className="text-sm text-muted-foreground">
          Organisez les cours de la classe pour {annee?.label || 'l’année sélectionnée'}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choisir une classe</CardTitle>
          <CardDescription>L’emploi du temps est défini séparément pour chaque classe et année.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={classeId} onValueChange={setClasseId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
            <SelectContent>
              {classes.map((classe) => (
                <SelectItem key={classe.id} value={String(classe.id)}>
                  {classe.name}{classe.level ? ` — ${classe.level}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {classeId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ajouter un cours</CardTitle>
              <CardDescription>
                Les conflits d’horaire avec la classe, l’enseignant ou la salle sont refusés.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Matière</label>
                <Select value={form.subject} onValueChange={(value) => updateForm('subject', value)}>
                  <SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jour</label>
                <Select value={form.weekday} onValueChange={(value) => updateForm('weekday', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Début</label>
                  <Input type="time" value={form.start_time} onChange={(event) => updateForm('start_time', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fin</label>
                  <Input type="time" value={form.end_time} onChange={(event) => updateForm('end_time', event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Enseignant (facultatif)</label>
                <Select value={form.teacher} onValueChange={(value) => updateForm('teacher', value)}>
                  <SelectTrigger><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Aucun enseignant</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.first_name} {teacher.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Salle (facultatif)</label>
                <Input value={form.room} onChange={(event) => updateForm('room', event.target.value)} placeholder="Ex. Salle 4" />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.subject || form.end_time <= form.start_time || createMutation.isPending}
                >
                  <Plus className="size-4" />
                  Ajouter au planning
                </Button>
              </div>
              {subjects.length === 0 && (
                <p className="text-sm text-muted-foreground md:col-span-4">
                  Ajoute d’abord les matières dans le module « Notes & bulletins ».
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {slotsByDay.map(({ label, slots: daySlots }) => (
              <Card key={label}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Chargement…</p>
                  ) : daySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun cours prévu</p>
                  ) : daySlots.map((slot) => (
                    <div key={slot.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          <Clock className="size-4 shrink-0 text-muted-foreground" />
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </p>
                        <p className="mt-1 truncate text-sm">{slot.subject_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[slot.teacher_display_name || slot.teacher_name, slot.room && `Salle ${slot.room}`].filter(Boolean).join(' · ') || 'Aucune précision'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteMutation.mutate(slot.id)}
                        disabled={deleteMutation.isPending}
                        title="Supprimer ce cours"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
