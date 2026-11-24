import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAnnee } from '@/lib/annee'
import { downloadSchoolReport, fetchSchoolReport } from '@/lib/reports-api'

function percentage(value) {
  return value === null || value === undefined ? '—' : `${value} %`
}

export default function ReportsPage() {
  const { anneeId } = useAnnee()
  const [downloading, setDownloading] = useState(false)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['school-report', anneeId],
    queryFn: () => fetchSchoolReport(anneeId),
    enabled: Boolean(anneeId),
  })

  async function download() {
    try {
      setDownloading(true)
      await downloadSchoolReport(anneeId)
    } catch {
      toast.error("Impossible de télécharger le rapport")
    } finally {
      setDownloading(false)
    }
  }

  if (!anneeId) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold">Rapports scolaires</h2>
        <p className="text-sm text-muted-foreground">Crée ou sélectionne une année scolaire pour consulter les rapports.</p>
      </div>
    )
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Calcul des rapports…</p>
  if (isError) {
    const detail = error?.response?.data?.annee || error?.response?.data?.detail
    return <p role="alert" className="text-sm text-destructive">{typeof detail === 'string' ? detail : 'Impossible de charger les rapports.'}</p>
  }

  const cards = [
    { label: 'Élèves inscrits', value: data.summary.students },
    { label: 'Classes', value: data.summary.classes },
    { label: 'Présence enregistrée', value: percentage(data.summary.attendance_rate) },
    { label: 'Moyenne générale', value: data.summary.average_out_of_20 ? `${data.summary.average_out_of_20} / 20` : '—' },
    { label: 'Remise des devoirs', value: percentage(data.summary.assignment_submission_rate) },
    { label: 'Incidents en cours', value: data.summary.open_incidents },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Rapports scolaires</h2>
          <p className="text-sm text-muted-foreground">
            Bilan de l’année {data.annee_label}, calculé à partir des données saisies dans SchoolConnect.
          </p>
        </div>
        <Button onClick={download} disabled={downloading}>
          <Download className="size-4" />
          {downloading ? 'Préparation…' : 'Exporter en CSV'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Résultats par classe</CardTitle>
          <CardDescription>
            La présence compte les élèves présents ou en retard parmi les appels renseignés.
            Les taux « — » indiquent qu’aucune donnée n’a encore été saisie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classe</TableHead>
                  <TableHead>Effectif</TableHead>
                  <TableHead>Appels renseignés</TableHead>
                  <TableHead>Présence</TableHead>
                  <TableHead>Moyenne / 20</TableHead>
                  <TableHead>Devoirs</TableHead>
                  <TableHead>Remises</TableHead>
                  <TableHead>Incidents ouverts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.classes.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Aucune classe pour cette année.</TableCell></TableRow>
                ) : data.classes.map((row) => (
                  <TableRow key={row.classe}>
                    <TableCell className="font-medium">{row.classe_name}{row.level ? ` · ${row.level}` : ''}</TableCell>
                    <TableCell>{row.students}</TableCell>
                    <TableCell>{row.attendance.marked}</TableCell>
                    <TableCell>{percentage(row.attendance.rate)}</TableCell>
                    <TableCell>{row.average_out_of_20 ? `${row.average_out_of_20} / 20` : '—'}</TableCell>
                    <TableCell>{row.assignments.total}</TableCell>
                    <TableCell>{percentage(row.assignments.rate)}</TableCell>
                    <TableCell>{row.incidents.open}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Présences par mois</CardTitle>
          <CardDescription>Nombre de statuts consignés dans les appels de chaque mois.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.monthly_attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun appel n’a été enregistré pour cette année.</p>
          ) : (
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead>Appels</TableHead>
                    <TableHead>Présents</TableHead>
                    <TableHead>Absents</TableHead>
                    <TableHead>En retard</TableHead>
                    <TableHead>Justifiés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.monthly_attendance.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell>{row.marked}</TableCell>
                      <TableCell>{row.present}</TableCell>
                      <TableCell>{row.absent}</TableCell>
                      <TableCell>{row.late}</TableCell>
                      <TableCell>{row.excused}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Mis à jour le {new Date(data.generated_at).toLocaleString('fr-FR')}. Ce rapport reflète uniquement les informations enregistrées.
      </p>
    </div>
  )
}
