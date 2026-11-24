export const SCOPE_LABELS = {
  CLASSE: 'Classe',
  NIVEAU: 'Niveau',
  ECOLE: "Toute l'école",
  INDIVIDUEL: 'Individuel',
}

export const CHANNEL_LABELS = {
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  AUTO: 'Auto',
  CASCADE: 'Cascade',
}

export const DEFAULT_CASCADE = [
  { channel: 'SMS', enabled: true },
  { channel: 'WHATSAPP', enabled: true },
  { channel: 'EMAIL', enabled: true },
]

/** Renvoie l'ordre retenu, ex. ['SMS', 'EMAIL'] — c'est ce que l'API attend. */
export function toChannelOrder(cascade) {
  return cascade.filter((row) => row.enabled).map((row) => row.channel)
}

export const STATUS_LABELS = {
  ENVOYE: 'Envoyé',
  PARTIEL: 'Partiel',
  ECHEC: 'Échec',
  BROUILLON: 'Brouillon',
  PLANIFIE: 'Programmé',
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  ANNULE: 'Annulé',
}

export const STATUS_STYLES = {
  ENVOYE: 'bg-success-600 text-neutral-0',
  PARTIEL: 'bg-accent-600 text-neutral-0',
  ECHEC: 'bg-error-600 text-neutral-0',
  BROUILLON: '',
  PLANIFIE: 'bg-primary-100 text-primary-800',
  EN_ATTENTE: 'bg-accent-100 text-accent-800',
  EN_COURS: 'bg-accent-100 text-accent-800',
  ANNULE: 'bg-muted text-muted-foreground',
}
