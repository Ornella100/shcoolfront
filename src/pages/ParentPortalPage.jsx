import { useQuery } from '@tanstack/react-query'
import { BookOpenCheck, CalendarCheck, ClipboardList, MessageSquareText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchParentPortalSummary } from '@/lib/parent-portal-api'

const ATTENDANCE_LABELS = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  LATE: 'En retard',
  EXCUSED: 'Absence justifiée',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR')
}

export default function ParentPortalPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['parent-portal-summary'],
    queryFn: fetchParentPortalSummary,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de votre espace famille…</p>
  }
  if (isError) {
    return <p role="alert" className="text-sm text-destructive">Impossible de charger les informations de vos enfants.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">
          Bonjour {data.parent.first_name} {data.parent.last_name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Espace famille · {data.parent.school}
          {data.annee ? ` · année scolaire ${data.annee}` : ''}
        </p>
      </div>

      {data.children.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun élève n’est rattaché à votre fiche. Contactez l’établissement pour mettre votre dossier à jour.
          </CardContent>
        </Card>
      ) : data.children.map((child) => (
        <Card key={child.id}>
          <CardHeader>
            <CardTitle>{child.first_name} {child.last_name}</CardTitle>
            <CardDescription>
              {child.classroom || 'Aucune classe active'}{child.matricule ? ` · matricule ${child.matricule}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <CalendarCheck className="size-4" />
                Présences de l’année
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(child.attendance).map(([status, count]) => (
                  <Badge variant={status === 'ABSENT' && count > 0 ? 'destructive' : 'secondary'} key={status}>
                    {ATTENDANCE_LABELS[status] || status} : {count}
                  </Badge>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <BookOpenCheck className="size-4" />
                Dernières notes
              </h3>
              {child.recent_grades.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune note publiée pour le moment.</p>
              ) : (
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Évaluation</TableHead>
                        <TableHead>Résultat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child.recent_grades.map((grade, index) => (
                        <TableRow key={`${grade.assessment}-${index}`}>
                          <TableCell>{formatDate(grade.date)}</TableCell>
                          <TableCell>{grade.subject}</TableCell>
                          <TableCell>{grade.assessment}</TableCell>
                          <TableCell>{grade.score} / {grade.max_score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <ClipboardList className="size-4" />
                Devoirs
              </h3>
              {child.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun devoir à afficher.</p>
              ) : (
                <div className="space-y-2">
                  {child.assignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{assignment.title}</p>
                        <Badge variant={assignment.status === 'PENDING' ? 'outline' : 'secondary'}>
                          {assignment.status_label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.subject || 'Sans matière'} · échéance {formatDate(assignment.due_date)}
                      </p>
                      {assignment.instructions && (
                        <p className="mt-2 whitespace-pre-wrap text-sm">{assignment.instructions}</p>
                      )}
                      {assignment.score && (
                        <p className="mt-2 text-sm font-medium">
                          Note : {assignment.score}{assignment.max_score ? ` / ${assignment.max_score}` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="size-5" />
            Messages de l’établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun message récent.</p>
          ) : data.messages.map((message) => (
            <article key={message.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{message.subject}</h3>
                <span className="text-xs text-muted-foreground">
                  {formatDate(message.sent_at)}{message.channel ? ` · ${message.channel}` : ''}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
