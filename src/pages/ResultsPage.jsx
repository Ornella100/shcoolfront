import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpenCheck, Plus, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAnnee } from '@/lib/annee'
import {
  createAssessment,
  createSubject,
  fetchAssessmentGrades,
  fetchAssessments,
  fetchBulletins,
  fetchSubjects,
  saveAssessmentGrades,
} from '@/lib/results-api'
import { fetchClasses } from '@/lib/schools-api'

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function ResultsPage() {
  const queryClient = useQueryClient()
  const { annee, anneeId } = useAnnee()
  const [classeId, setClasseId] = useState('')
  const [assessmentId, setAssessmentId] = useState('')
  const [students, setStudents] = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [assessmentForm, setAssessmentForm] = useState({
    subject: '',
    title: '',
    date: localToday(),
    max_score: '20',
    coefficient: '1',
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: () => fetchClasses(undefined, anneeId),
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })
  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', classeId, anneeId],
    queryFn: () => fetchAssessments(classeId, anneeId),
    enabled: Boolean(classeId && anneeId),
  })
  const { data: gradesData, isLoading: gradesLoading } = useQuery({
    queryKey: ['assessment-grades', assessmentId],
    queryFn: () => fetchAssessmentGrades(assessmentId),
    enabled: Boolean(assessmentId),
  })
  const { data: bulletin } = useQuery({
    queryKey: ['bulletins', classeId, anneeId],
    queryFn: () => fetchBulletins(classeId, anneeId),
    enabled: Boolean(classeId && anneeId),
  })

  useEffect(() => {
    // Populate the editable grade draft after selecting/loading an assessment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudents(gradesData?.students ?? [])
  }, [gradesData])

  const assessmentMutation = useMutation({
    mutationFn: () => createAssessment({
      ...assessmentForm,
      classroom: Number(classeId),
      subject: Number(assessmentForm.subject),
    }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', classeId, anneeId] })
      queryClient.invalidateQueries({ queryKey: ['bulletins', classeId, anneeId] })
      setAssessmentId(String(created.id))
      setAssessmentForm((current) => ({ ...current, title: '' }))
      toast.success('Évaluation créée')
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Impossible de créer l'évaluation"),
  })

  const subjectMutation = useMutation({
    mutationFn: () => createSubject({ name: subjectName.trim() }),
    onSuccess: (subject) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setSubjectName('')
      setAssessmentForm((current) => ({ ...current, subject: String(subject.id) }))
      toast.success('Matière ajoutée')
    },
    onError: (error) => {
      const detail = error?.response?.data?.name
      toast.error(typeof detail === 'string' ? detail : 'Impossible de créer cette matière')
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => saveAssessmentGrades(assessmentId, students),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-grades', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['assessments', classeId, anneeId] })
      queryClient.invalidateQueries({ queryKey: ['bulletins', classeId, anneeId] })
      toast.success('Notes enregistrées')
    },
    onError: (error) => toast.error(error?.response?.data?.detail || 'Impossible d’enregistrer les notes'),
  })

  const subjectColumns = useMemo(
    () => bulletin?.students?.[0]?.subjects ?? [],
    [bulletin],
  )

  function updateStudent(studentId, field, value) {
    setStudents((current) =>
      current.map((student) => student.id === studentId ? { ...student, [field]: value } : student),
    )
  }

  function updateAssessmentForm(field, value) {
    setAssessmentForm((current) => ({ ...current, [field]: value }))
  }

  const currentAssessment = assessments.find((assessment) => String(assessment.id) === assessmentId)
  const hasNoSubject = subjects.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Notes et bulletins</h2>
        <p className="text-sm text-muted-foreground">
          Gérez les matières, créez des évaluations et consultez les moyennes
          {annee?.label ? ` pour ${annee.label}` : ''}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Choisir une classe</CardTitle>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={classeId} onValueChange={(value) => {
            setClasseId(value)
            setAssessmentId('')
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
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
        <Card>
          <CardHeader>
            <CardTitle>2. Matières et évaluations</CardTitle>
            <CardDescription>
              Une note est ramenée sur 20 pour calculer les moyennes, en tenant compte des coefficients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
              event.preventDefault()
              if (subjectName.trim()) subjectMutation.mutate()
            }}>
              <div className="min-w-56 flex-1 space-y-2">
                <label className="text-sm font-medium" htmlFor="subject-name">Nouvelle matière</label>
                <Input
                  id="subject-name"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="Ex. Mathématiques"
                  maxLength={100}
                />
              </div>
              <Button type="submit" variant="outline" disabled={!subjectName.trim() || subjectMutation.isPending}>
                <Plus className="size-4" />
                Ajouter la matière
              </Button>
            </form>

            <div className="grid gap-3 md:grid-cols-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Matière</label>
                <Select
                  value={assessmentForm.subject}
                  onValueChange={(value) => updateAssessmentForm('subject', value)}
                  disabled={hasNoSubject}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nom de l’évaluation</label>
                <Input
                  value={assessmentForm.title}
                  onChange={(event) => updateAssessmentForm('title', event.target.value)}
                  placeholder="Ex. Contrôle 1"
                  maxLength={150}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={assessmentForm.date} onChange={(event) => updateAssessmentForm('date', event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note max.</label>
                <Input type="number" min="0.01" step="0.01" value={assessmentForm.max_score} onChange={(event) => updateAssessmentForm('max_score', event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Coefficient</label>
                <Input type="number" min="0.01" step="0.01" value={assessmentForm.coefficient} onChange={(event) => updateAssessmentForm('coefficient', event.target.value)} />
              </div>
            </div>
            <Button
              onClick={() => assessmentMutation.mutate()}
              disabled={
                !assessmentForm.subject || !assessmentForm.title.trim() ||
                !assessmentForm.date || assessmentMutation.isPending
              }
            >
              <Plus className="size-4" />
              Créer l’évaluation
            </Button>

            {assessments.length > 0 && (
              <div className="max-w-xl space-y-2">
                <label className="text-sm font-medium">Saisir ou modifier les notes</label>
                <Select value={assessmentId} onValueChange={setAssessmentId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une évaluation" /></SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={String(assessment.id)}>
                        {assessment.subject_name} — {assessment.title} ({assessment.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {assessmentId && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{currentAssessment?.subject_name} — {currentAssessment?.title}</CardTitle>
              <CardDescription>
                Notes sur {currentAssessment?.max_score}; laissez vide si l’élève n’a pas encore été évalué.
              </CardDescription>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={gradesLoading || students.length === 0 || saveMutation.isPending}>
              <Save className="size-4" />
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer les notes'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Note / {currentAssessment?.max_score}</TableHead>
                    <TableHead>Appréciation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.last_name} {student.first_name}</TableCell>
                      <TableCell>{student.matricule || '—'}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={currentAssessment?.max_score}
                          step="0.01"
                          value={student.score ?? ''}
                          onChange={(event) => updateStudent(student.id, 'score', event.target.value === '' ? null : event.target.value)}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={student.appreciation || ''}
                          onChange={(event) => updateStudent(student.id, 'appreciation', event.target.value)}
                          placeholder="Facultatif"
                          maxLength={300}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!gradesLoading && students.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Aucun élève inscrit dans cette classe.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {classeId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenCheck className="size-5" />
              Bulletin de la classe
            </CardTitle>
            <CardDescription>
              Moyennes calculées sur 20 avec les coefficients des évaluations et des matières.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!bulletin?.students?.length ? (
              <p className="text-sm text-muted-foreground">Aucun élève inscrit ou aucune donnée de bulletin.</p>
            ) : (
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Élève</TableHead>
                      {subjectColumns.map((subject) => <TableHead key={subject.id}>{subject.name}</TableHead>)}
                      <TableHead>Moyenne générale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulletin.students.map((student) => (
                      <TableRow key={student.student}>
                        <TableCell className="font-medium">{student.last_name} {student.first_name}</TableCell>
                        {student.subjects.map((subject) => (
                          <TableCell key={subject.id}>
                            {subject.average_out_of_20 === null
                              ? <span className="text-muted-foreground">—</span>
                              : <Badge variant="outline">{subject.average_out_of_20}/20</Badge>}
                          </TableCell>
                        ))}
                        <TableCell className="font-semibold">
                          {student.average_out_of_20 ? `${student.average_out_of_20}/20` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
