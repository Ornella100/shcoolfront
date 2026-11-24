import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, Plus, XCircle } from 'lucide-react'
import { useState } from 'react'
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
  cancelFeeInvoice,
  fetchFees,
  generateClassFees,
  recordFeePayment,
} from '@/lib/fees-api'
import { fetchClasses } from '@/lib/schools-api'

const PAYMENT_METHODS = [
  ['CASH', 'Espèces'],
  ['MOBILE_MONEY', 'Mobile money'],
  ['BANK_TRANSFER', 'Virement bancaire'],
  ['OTHER', 'Autre'],
]

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`
}

function getFinancialStatus(invoice) {
  if (invoice.status === 'CANCELLED') return ['Annulée', 'outline']
  if (invoice.financial_status === 'PAID') return ['Soldée', 'secondary']
  if (invoice.financial_status === 'PARTIAL') return ['Partielle', 'outline']
  return ['À payer', 'destructive']
}

export default function FeesPage() {
  const queryClient = useQueryClient()
  const { annee, anneeId } = useAnnee()
  const [classeId, setClasseId] = useState('')
  const [invoiceTitle, setInvoiceTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(localToday)
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('')
  const [payment, setPayment] = useState({
    amount: '',
    method: 'MOBILE_MONEY',
    reference: '',
    paid_at: localToday(),
    note: '',
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: () => fetchClasses(undefined, anneeId),
  })
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['fees', classeId, anneeId],
    queryFn: () => fetchFees(classeId, anneeId),
    enabled: Boolean(classeId && anneeId),
  })

  const generateMutation = useMutation({
    mutationFn: () => generateClassFees({
      classroom: Number(classeId),
      title: invoiceTitle.trim(),
      amount,
      due_date: dueDate,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fees', classeId, anneeId] })
      setInvoiceTitle('')
      setAmount('')
      toast.success(`${data.created} facture(s) créée(s), ${data.already_exists} déjà existante(s)`)
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail || error?.response?.data?.classroom
      toast.error(typeof detail === 'string' ? detail : 'Impossible de créer les frais')
    },
  })

  const paymentMutation = useMutation({
    mutationFn: () => recordFeePayment(paymentInvoiceId, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', classeId, anneeId] })
      setPaymentInvoiceId('')
      setPayment({ amount: '', method: 'MOBILE_MONEY', reference: '', paid_at: localToday(), note: '' })
      toast.success('Paiement enregistré')
    },
    onError: (error) => {
      const detail = error?.response?.data?.amount || error?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Le paiement dépasse peut-être le solde restant')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelFeeInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', classeId, anneeId] })
      toast.success('Facture annulée')
    },
    onError: () => toast.error('Impossible d’annuler cette facture'),
  })

  const totalAmount = invoices.filter((invoice) => invoice.status !== 'CANCELLED')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0)
  const totalPaid = invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount), 0)
  const totalBalance = invoices.filter((invoice) => invoice.status !== 'CANCELLED')
    .reduce((sum, invoice) => sum + Number(invoice.balance), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Frais scolaires</h2>
        <p className="text-sm text-muted-foreground">
          Émets les frais de scolarité et suis les paiements de l’année {annee?.label || 'sélectionnée'}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choisir une classe</CardTitle>
          <CardDescription>Les factures sont créées une fois par élève inscrit dans la classe.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={classeId} onValueChange={(value) => {
            setClasseId(value)
            setPaymentInvoiceId('')
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
              <CardTitle>Émettre des frais pour la classe</CardTitle>
              <CardDescription>
                Les factures portant déjà ce même libellé ne seront pas dupliquées.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Libellé</label>
                <Input value={invoiceTitle} onChange={(event) => setInvoiceTitle(event.target.value)} placeholder="Ex. Tranche 1" maxLength={120} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Montant (FCFA)</label>
                <Input type="number" min="0.01" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ex. 25000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date limite</label>
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div>
                <Button onClick={() => generateMutation.mutate()} disabled={!invoiceTitle.trim() || !amount || Number(amount) <= 0 || !dueDate || generateMutation.isPending}>
                  <Plus className="size-4" />
                  {generateMutation.isPending ? 'Création…' : 'Créer les factures'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader><CardDescription>Montant facturé</CardDescription><CardTitle>{formatMoney(totalAmount)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Montant encaissé</CardDescription><CardTitle>{formatMoney(totalPaid)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Solde restant</CardDescription><CardTitle>{formatMoney(totalBalance)}</CardTitle></CardHeader></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Factures et paiements</CardTitle>
              <CardDescription>{invoices.length} facture(s) dans cette classe</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des factures…</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune facture créée pour cette classe et cette année.</p>
              ) : (
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Élève</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Payé</TableHead>
                        <TableHead>Solde</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => {
                        const [statusLabel, statusVariant] = getFinancialStatus(invoice)
                        const editingPayment = paymentInvoiceId === String(invoice.id)
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.student_name}</TableCell>
                            <TableCell>{invoice.title}</TableCell>
                            <TableCell>{invoice.due_date}</TableCell>
                            <TableCell>{formatMoney(invoice.amount)}</TableCell>
                            <TableCell>{formatMoney(invoice.paid_amount)}</TableCell>
                            <TableCell>{formatMoney(invoice.balance)}</TableCell>
                            <TableCell><Badge variant={statusVariant}>{statusLabel}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {invoice.status === 'ISSUED' && Number(invoice.balance) > 0 && (
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setPaymentInvoiceId(editingPayment ? '' : String(invoice.id))
                                    setPayment((current) => ({ ...current, amount: invoice.balance }))
                                  }}>
                                    <Banknote className="size-4" />
                                    Paiement
                                  </Button>
                                )}
                                {invoice.status === 'ISSUED' && Number(invoice.paid_amount) === 0 && (
                                  <Button variant="ghost" size="icon-sm" title="Annuler la facture" onClick={() => cancelMutation.mutate(invoice.id)} disabled={cancelMutation.isPending}>
                                    <XCircle className="size-4" />
                                  </Button>
                                )}
                              </div>
                              {editingPayment && (
                                <div className="mt-3 min-w-72 space-y-2 rounded-md border bg-card p-3">
                                  <Input type="number" min="0.01" max={invoice.balance} step="0.01" value={payment.amount} onChange={(event) => setPayment((current) => ({ ...current, amount: event.target.value }))} placeholder="Montant reçu" />
                                  <Select value={payment.method} onValueChange={(value) => setPayment((current) => ({ ...current, method: value }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {PAYMENT_METHODS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Input type="date" value={payment.paid_at} onChange={(event) => setPayment((current) => ({ ...current, paid_at: event.target.value }))} />
                                  <Input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} placeholder="Référence (facultatif)" maxLength={100} />
                                  <Input value={payment.note} onChange={(event) => setPayment((current) => ({ ...current, note: event.target.value }))} placeholder="Note (facultative)" maxLength={300} />
                                  <Button size="sm" onClick={() => paymentMutation.mutate()} disabled={!payment.amount || Number(payment.amount) <= 0 || Number(payment.amount) > Number(invoice.balance) || paymentMutation.isPending}>
                                    Enregistrer le paiement
                                  </Button>
                                </div>
                              )}
                              {invoice.payments.length > 0 && (
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  {invoice.payments.map((item) => (
                                    <p key={item.id}>{formatMoney(item.amount)} · {item.method_label} · {item.paid_at}{item.reference ? ` · ${item.reference}` : ''}</p>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
