import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useAnnee } from '@/lib/annee'
import { createIncident, deleteIncident, fetchIncidents, updateIncident } from '@/lib/discipline-api'
import { fetchClasses, fetchEleves } from '@/lib/schools-api'

const CATEGORIES = [
  ['BEHAVIOR', 'Comportement'],
  ['BULLYING', 'Harcèlement'],
  ['HEALTH', 'Santé'],
  ['PROPERTY', 'Dégradation ou perte'],
  ['OTHER', 'Autre'],
]
const SEVERITIES = [
  ['LOW', 'Faible'],
  ['MEDIUM', 'Moyenne'],
  ['HIGH', 'Élevée'],
]

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const EMPTY_FORM = {
  student: '',
  date: localToday(),
  category: 'OTHER',
  severity: 'LOW',
  description: '',
  action_taken: '',
}

export default function DisciplinePage() {
  const queryClient = useQueryClient()
  const { annee, anneeId } = useAnnee()
  const [classeId, setClasseId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [resolutionDrafts, setResolutionDrafts] = useState({})

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: () => fetchClasses(undefined, anneeId),
  })
  const { data: students = [] } = useQuery({
    queryKey: ['eleves', classeId, anneeId],
    queryFn: () => fetchEleves(classeId, undefined, anneeId),
    enabled: Boolean(classeId && anneeId),
  })
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', classeId, anneeId, statusFilter],
    queryFn: () => fetchIncidents({ classeId, anneeId, status: statusFilter }),
    enabled: Boolean(classeId && anneeId),
  })

  useEffect(() => {
    // Keep locally editable resolution drafts aligned with refreshed incidents.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolutionDrafts((current) => {
      const next = { ...current }
      for (const incident of incidents) {
        next[incident.id] ??= incident.resolution || ''
      }
      return next
    })
  }, [incidents])

  function refreshIncidents() {
    queryClient.invalidateQueries({ queryKey: ['incidents', classeId, anneeId] })
  }

  const createMutation = useMutation({
    mutationFn: () => createIncident({ ...form, student: Number(form.student), classroom: Number(classeId) }),
    onSuccess: () => {
      refreshIncidents()
      setForm({ ...EMPTY_FORM, date: localToday() })
      toast.success('Incident enregistré')
    },
    onError: (error) => {
      const message = error?.response?.data?.student || error?.response?.data?.detail
      toast.error(typeof message === 'string' ? message : 'Impossible d’enregistrer cet incident')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateIncident,
    onSuccess: refreshIncidents,
    onError: () => toast.error('Impossible de mettre à jour le suivi'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => {
      refreshIncidents()
      toast.success('Incident supprimé')
    },
    onError: () => toast.error('Impossible de supprimer cet incident'),
  })

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Discipline et incidents</h2>
        <p className="text-sm text-muted-foreground">
          Consignez les incidents, les mesures prises et leur résolution
          {annee?.label ? ` pour ${annee.label}` : ''}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choisir la classe</CardTitle>
          <CardDescription>Les fiches sont liées à l’inscription de l’élève sur l’année sélectionnée.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={classeId} onValueChange={(value) => {
            setClasseId(value)
            setForm((current) => ({ ...current, student: '' }))
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
              <CardTitle>Signaler un incident</CardTitle>
              <CardDescription>
                Cette fiche est visible aux utilisateurs connectés de l’établissement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Élève concerné</label>
                  <Select value={form.student} onValueChange={(value) => updateForm('student', value)}>
                    <SelectTrigger><SelectValue placeholder="Choisir un élève" /></SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={String(student.id)}>
                          {student.last_name} {student.first_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select value={form.category} onValueChange={(value) => updateForm('category', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gravité</label>
                  <Select value={form.severity} onValueChange={(value) => updateForm('severity', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                    placeholder="Décris les faits de façon précise et objective"
                    maxLength={3000}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mesures prises (facultatif)</label>
                  <Textarea
                    value={form.action_taken}
                    onChange={(event) => updateForm('action_taken', event.target.value)}
                    placeholder="Entretien, accompagnement, mesure décidée…"
                    maxLength={2000}
                    rows={4}
                  />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.student || !form.date || !form.description.trim() || createMutation.isPending}
              >
                <Plus className="size-4" />
                Enregistrer l’incident
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Suivi des incidents</CardTitle>
                <CardDescription>{incidents.length} fiche(s) pour cette classe</CardDescription>
              </div>
              <Select value={statusFilter || 'ALL'} onValueChange={(value) => setStatusFilter(value === 'ALL' ? '' : value)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="OPEN">En cours</SelectItem>
                  <SelectItem value="RESOLVED">Résolus</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des incidents…</p>
              ) : incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun incident pour ce filtre.</p>
              ) : incidents.map((incident) => (
                <article key={incident.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {incident.student_name} · {incident.category_label}
                      </h3>
                      <p className="text-sm text-muted-foreground">{incident.date} · {incident.classroom_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={incident.severity === 'HIGH' ? 'destructive' : 'outline'}>
                        {incident.severity_label}
                      </Badge>
                      <Select
                        value={incident.status}
                        onValueChange={(value) => {
                          if (value === 'OPEN') {
                            setResolutionDrafts((current) => ({ ...current, [incident.id]: '' }))
                          }
                          updateMutation.mutate({ id: incident.id, payload: { status: value } })
                        }}
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">En cours</SelectItem>
                          <SelectItem value="RESOLVED">Résolu</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Supprimer la fiche"
                        onClick={() => deleteMutation.mutate(incident.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{incident.description}</p>
                  {incident.action_taken && (
                    <p className="mt-2 text-sm"><span className="font-medium">Mesures prises :</span> {incident.action_taken}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={resolutionDrafts[incident.id] ?? ''}
                      onChange={(event) => setResolutionDrafts((current) => ({
                        ...current,
                        [incident.id]: event.target.value,
                      }))}
                      placeholder="Compte rendu du suivi ou de la résolution"
                      maxLength={2000}
                      className="min-w-64 flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({
                        id: incident.id,
                        payload: { resolution: resolutionDrafts[incident.id] || '' },
                      })}
                      disabled={updateMutation.isPending}
                    >
                      Enregistrer le suivi
                    </Button>
                  </div>
                  {incident.status === 'RESOLVED' && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="size-4" />
                      Résolu{incident.resolved_at ? ` le ${new Date(incident.resolved_at).toLocaleDateString('fr-FR')}` : ''}
                      {incident.resolution && ` — ${incident.resolution}`}
                    </p>
                  )}
                  {incident.severity === 'HIGH' && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="size-4" />
                      Incident de gravité élevée
                    </p>
                  )}
                </article>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
