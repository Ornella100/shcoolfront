import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, ClipboardCheck } from 'lucide-react'
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
import { fetchAttendance, saveAttendance } from '@/lib/attendance-api'
import { fetchClasses } from '@/lib/schools-api'

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Présent' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'En retard' },
  { value: 'EXCUSED', label: 'Absence justifiée' },
]

function localToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export default function AttendancePage() {
  const queryClient = useQueryClient()
  const { annee, anneeId } = useAnnee()
  const [date, setDate] = useState(localToday)
  const [classeId, setClasseId] = useState('')
  const [students, setStudents] = useState([])

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: () => fetchClasses(undefined, anneeId),
  })
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', classeId, date],
    queryFn: () => fetchAttendance(classeId, date),
    enabled: Boolean(classeId && date),
  })

  useEffect(() => {
    // Populate the editable attendance draft after the API response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudents(data?.students ?? [])
  }, [data])

  const markedCount = useMemo(
    () => students.filter((student) => Boolean(student.status)).length,
    [students],
  )
  const complete = students.length > 0 && markedCount === students.length

  const saveMutation = useMutation({
    mutationFn: () => saveAttendance(classeId, date, students),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', classeId, date] })
      toast.success('Appel enregistré')
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || err?.response?.data?.students
      toast.error(detail || "Impossible d'enregistrer l'appel")
    },
  })

  function updateStudent(studentId, field, value) {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId ? { ...student, [field]: value } : student,
      ),
    )
  }

  function markAllPresent() {
    setStudents((current) =>
      current.map((student) => ({ ...student, status: student.status || 'PRESENT' })),
    )
  }

  const selectedClass = classes.find((classe) => String(classe.id) === classeId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Présences et absences</h2>
        <p className="text-sm text-muted-foreground">
          Faites l’appel et enregistrez le statut des élèves
          {annee?.label ? ` pour l'année ${annee.label}` : ''}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choisir une classe et une date</CardTitle>
          <CardDescription>
            La liste comprend les élèves inscrits dans la classe pour l’année scolaire sélectionnée.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-sm space-y-2">
            <label className="text-sm font-medium" htmlFor="attendance-class">Classe</label>
            <Select value={classeId} onValueChange={setClasseId}>
              <SelectTrigger id="attendance-class">
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="attendance-date">Date</label>
            <Input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {classeId && date && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-5" />
                {selectedClass?.name || data?.classe_name || 'Appel'}
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Chargement des élèves…'
                  : `${markedCount} sur ${students.length} élève(s) renseigné(s)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {data?.session_id && <Badge variant="secondary">Appel déjà enregistré</Badge>}
              <Button
                variant="outline"
                onClick={markAllPresent}
                disabled={isLoading || students.length === 0}
              >
                <CheckCheck className="size-4" />
                Marquer les non renseignés présents
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isError ? (
              <p role="alert" className="text-sm text-destructive">
                {error?.response?.data?.detail || 'Impossible de charger la liste des élèves.'}
              </p>
            ) : students.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground">
                Aucun élève inscrit dans cette classe pour cette année.
              </p>
            ) : (
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Élève</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead className="min-w-56">Statut</TableHead>
                      <TableHead className="min-w-60">Note (facultative)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.last_name} {student.first_name}
                        </TableCell>
                        <TableCell>{student.matricule || '—'}</TableCell>
                        <TableCell>
                          <Select
                            value={student.status || 'NON_MARQUE'}
                            onValueChange={(value) =>
                              updateStudent(student.id, 'status', value === 'NON_MARQUE' ? null : value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="À renseigner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NON_MARQUE">À renseigner</SelectItem>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={student.note || ''}
                            onChange={(event) => updateStudent(student.id, 'note', event.target.value)}
                            placeholder="Ex. rendez-vous médical"
                            maxLength={300}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Les absences justifiées et les notes restent modifiables après l’enregistrement.
              </p>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!complete || saveMutation.isPending || isLoading}
              >
                {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer l’appel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
