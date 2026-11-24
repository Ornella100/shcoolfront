import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAnnee } from '@/lib/annee'
import {
  createAssignment,
  deleteAssignment,
  fetchAssignmentSubmissions,
  fetchAssignments,
  saveAssignmentSubmissions,
} from '@/lib/assignments-api'
import { fetchClasses } from '@/lib/schools-api'
import { fetchSubjects } from '@/lib/results-api'

const STATUS_OPTIONS = [
  ['PENDING', 'À remettre'],
  ['SUBMITTED', 'Remis'],
  ['LATE', 'Remis en retard'],
  ['REVIEWED', 'Corrigé'],
]

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient()
  const { annee, anneeId } = useAnnee()
  const [classeId, setClasseId] = useState('')
  const [assignmentId, setAssignmentId] = useState('')
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({
    subject: '',
    title: '',
    instructions: '',
    assigned_date: localToday(),
    due_date: localToday(),
    max_score: '',
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: () => fetchClasses(undefined, anneeId),
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', classeId, anneeId],
    queryFn: () => fetchAssignments(classeId, anneeId),
    enabled: Boolean(classeId && anneeId),
  })
  const { data: submissionData, isLoading: submissionsLoading } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => fetchAssignmentSubmissions(assignmentId),
    enabled: Boolean(assignmentId),
  })

  useEffect(() => {
    // Populate the editable local draft when a different assignment is loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudents(submissionData?.students ?? [])
  }, [submissionData])

  const createMutation = useMutation({
    mutationFn: () => createAssignment({
      ...form,
      classroom: Number(classeId),
      subject: form.subject ? Number(form.subject) : null,
      max_score: form.max_score || null,
    }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', classeId, anneeId] })
      setAssignmentId(String(created.id))
      setForm((current) => ({ ...current, title: '', instructions: '' }))
      toast.success('Devoir créé')
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail || error?.response?.data?.due_date
      toast.error(typeof detail === 'string' ? detail : 'Impossible de créer le devoir')
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => saveAssignmentSubmissions(assignmentId, students),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['assignments', classeId, anneeId] })
      toast.success('Suivi des remises enregistré')
    },
    onError: () => toast.error('Impossible d’enregistrer le suivi'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', classeId, anneeId] })
      if (String(deletedId) === assignmentId) {
        setAssignmentId('')
        setStudents([])
      }
      toast.success('Devoir supprimé')
    },
    onError: () => toast.error('Impossible de supprimer le devoir'),
  })

  function updateStudent(id, field, value) {
    setStudents((current) => current.map((student) =>
      student.id === id ? { ...student, [field]: value } : student,
    ))
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const currentAssignment = assignments.find((assignment) => String(assignment.id) === assignmentId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Devoirs et travaux</h2>
        <p className="text-sm text-muted-foreground">
          Publiez les consignes et suivez les remises de la classe
          {annee?.label ? ` pour ${annee.label}` : ''}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choisir une classe</CardTitle>
          <CardDescription>Les devoirs et les remises sont rattachés à une classe et à une année.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={classeId} onValueChange={(value) => {
            setClasseId(value)
            setAssignmentId('')
          }}>
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
              <CardTitle>Créer un devoir</CardTitle>
              <CardDescription>
                Les élèves ne disposent pas encore d’un portail de dépôt ; le statut de remise est suivi par l’équipe scolaire.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matière (facultatif)</label>
                  <Select value={form.subject || 'NONE'} onValueChange={(value) => updateForm('subject', value === 'NONE' ? '' : value)}>
                    <SelectTrigger><SelectValue placeholder="Aucune matière" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Aucune matière</SelectItem>
                      {subjects.map((subject) => <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                    placeholder="Ex. Exercices de mathématiques"
                    maxLength={180}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Barème (facultatif)</label>
                  <Input type="number" min="0.01" step="0.01" value={form.max_score} onChange={(event) => updateForm('max_score', event.target.value)} placeholder="Ex. 20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de publication</label>
                  <Input type="date" value={form.assigned_date} onChange={(event) => updateForm('assigned_date', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date limite</label>
                  <Input type="date" value={form.due_date} onChange={(event) => updateForm('due_date', event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Consignes</label>
                <Textarea
                  value={form.instructions}
                  onChange={(event) => updateForm('instructions', event.target.value)}
                  placeholder="Décrivez le travail attendu et les modalités de remise"
                  maxLength={5000}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.title.trim() || !form.assigned_date || !form.due_date || form.due_date < form.assigned_date || createMutation.isPending}
              >
                <Plus className="size-4" />
                Créer le devoir
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Devoirs de la classe</CardTitle>
              <CardDescription>{assignments.length} devoir(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun devoir créé pour cette classe.</p>
              ) : assignments.map((assignment) => (
                <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.subject_name || 'Sans matière'} · échéance {assignment.due_date} · {assignment.submission_count} remise(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={assignmentId === String(assignment.id) ? 'default' : 'outline'} size="sm" onClick={() => setAssignmentId(String(assignment.id))}>
                      <ClipboardList className="size-4" />
                      Suivre les remises
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Supprimer le devoir" onClick={() => deleteMutation.mutate(assignment.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {assignmentId && currentAssignment && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{currentAssignment.title}</CardTitle>
              <CardDescription>
                À remettre avant le {currentAssignment.due_date}
                {currentAssignment.max_score ? ` · barème ${currentAssignment.max_score}` : ''}
              </CardDescription>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={submissionsLoading || students.length === 0 || saveMutation.isPending}>
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer le suivi'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentAssignment.instructions && (
              <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{currentAssignment.instructions}</p>
            )}
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Statut de remise</TableHead>
                    <TableHead>Note{currentAssignment.max_score ? ` / ${currentAssignment.max_score}` : ''}</TableHead>
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.last_name} {student.first_name}</TableCell>
                      <TableCell>
                        <Select value={student.status} onValueChange={(value) => updateStudent(student.id, 'status', value)}>
                          <SelectTrigger className="min-w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={currentAssignment.max_score || undefined}
                          step="0.01"
                          value={student.score ?? ''}
                          onChange={(event) => updateStudent(student.id, 'score', event.target.value === '' ? null : event.target.value)}
                          disabled={!currentAssignment.max_score}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input value={student.comment || ''} onChange={(event) => updateStudent(student.id, 'comment', event.target.value)} maxLength={1000} placeholder="Facultatif" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!submissionsLoading && students.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Aucun élève inscrit dans cette classe.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {students.some((student) => student.submitted_at) && (
              <div className="flex flex-wrap gap-2">
                {students.filter((student) => student.submitted_at).map((student) => (
                  <Badge variant="secondary" key={student.id}>
                    {student.last_name} : remis le {new Date(student.submitted_at).toLocaleDateString('fr-FR')}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
