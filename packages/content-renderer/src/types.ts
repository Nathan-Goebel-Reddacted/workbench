import type { SectionType, SectionContent } from './sectionTypes'

export type SectionPosition = { x: number; y: number; w: number; h: number }

export type SectionDto = {
  id: string
  type: SectionType
  contentRef: string | null
  content: SectionContent
} & SectionPosition

export type PageLayoutDto = {
  id: string
  pageType: string
  pageRef: string
  sections: SectionDto[]
}

// --- Contenu du widget texte ---
// Un unique éditeur riche. Le HTML peut contenir des jetons de données live (voir dataBinding.ts).
export type TextContent = { html: string }

// Normalise un content brut (issu de la base, potentiellement legacy) en TextContent sûr.
export function readTextContent(content: Record<string, unknown>): TextContent {
  // Legacy : ancien widget « texte libre » stockait content.text ; l'ancien modèle content.html.
  // Les anciens binds `source:'project'` (sans html) retombent sur une chaîne vide (OK en dev).
  const legacy = typeof content.text === 'string' ? content.text : ''
  const html = typeof content.html === 'string' ? content.html : legacy
  return { html }
}

// --- Contenu du widget image ---
export type ImageFit = 'contain' | 'cover' | 'fill'
export type ImagePosition =
  | 'top left'
  | 'top'
  | 'top right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom left'
  | 'bottom'
  | 'bottom right'

export type ImageContent = {
  url: string
  alt: string
  fit: ImageFit
  position: ImagePosition
  radius: number
}

export const IMAGE_FIT_OPTIONS: { value: ImageFit; label: string }[] = [
  { value: 'contain', label: 'Entière (sans rognage)' },
  { value: 'cover', label: 'Remplir le bloc (rognée)' },
  { value: 'fill', label: 'Étirer (déformée)' },
]

export const IMAGE_POSITION_OPTIONS: { value: ImagePosition; label: string }[] = [
  { value: 'top left', label: 'Haut gauche' },
  { value: 'top', label: 'Haut' },
  { value: 'top right', label: 'Haut droite' },
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Droite' },
  { value: 'bottom left', label: 'Bas gauche' },
  { value: 'bottom', label: 'Bas' },
  { value: 'bottom right', label: 'Bas droite' },
]

// Normalise un content brut en ImageContent sûr. Les images créées avant l'ajout
// des options de rendu n'ont ni fit ni position : elles retombent sur les défauts.
export function readImageContent(content: Record<string, unknown>): ImageContent {
  const fit = content.fit
  const position = content.position
  const radius = Number(content.radius)
  return {
    url: typeof content.url === 'string' ? content.url : '',
    alt: typeof content.alt === 'string' ? content.alt : '',
    fit: IMAGE_FIT_OPTIONS.some(o => o.value === fit) ? (fit as ImageFit) : 'contain',
    position: IMAGE_POSITION_OPTIONS.some(o => o.value === position) ? (position as ImagePosition) : 'center',
    radius: Number.isFinite(radius) ? Math.min(Math.max(radius, 0), 64) : 4,
  }
}

// --- Contenu du widget code ---
// Bloc de code non exécuté : le texte est rendu tel quel dans un <pre>. Le langage
// n'est qu'une étiquette affichée — aucune coloration syntaxique, donc aucune
// dépendance de rendu supplémentaire.
export type CodeContent = { code: string; language: string; wrap: boolean }

export const CODE_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Aucun' },
  { value: 'bash', label: 'Bash' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'typescript', label: 'TypeScript' },
]

export function readCodeContent(content: Record<string, unknown>): CodeContent {
  return {
    code: typeof content.code === 'string' ? content.code : '',
    language: typeof content.language === 'string' ? content.language : '',
    wrap: content.wrap === true,
  }
}

// --- Contenu du widget embed ---
// Iframe vers un service tiers (carte, lecteur, démo). L'URL est validée avant rendu :
// seuls http(s) passent, ce qui écarte javascript: et data:. Voir isEmbeddableUrl.
export type EmbedContent = { url: string; title: string; radius: number }

export function readEmbedContent(content: Record<string, unknown>): EmbedContent {
  const radius = Number(content.radius)
  return {
    url: typeof content.url === 'string' ? content.url : '',
    title: typeof content.title === 'string' ? content.title : '',
    radius: Number.isFinite(radius) ? Math.min(Math.max(radius, 0), 64) : 4,
  }
}

// Une URL d'embed est saisie à la main dans l'éditeur : sans ce filtre, un
// `javascript:` ou un `data:text/html` s'exécuterait dans l'origine du site.
export function isEmbeddableUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// --- Contenu du widget lien ---
// Le widget reste lié aux liens du projet/portfolio via son contentRef ; les liens
// externes saisis à la main s'y ajoutent et vivent dans le content de la section.
export type ExternalLink = { url: string; displayText: string; logo: string }

export function readLinkContent(content: Record<string, unknown>): { externalLinks: ExternalLink[] } {
  const raw = Array.isArray(content.externalLinks) ? content.externalLinks : []
  const externalLinks = raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(item => ({
      url: typeof item.url === 'string' ? item.url : '',
      displayText: typeof item.displayText === 'string' ? item.displayText : '',
      logo: typeof item.logo === 'string' ? item.logo : '',
    }))
  return { externalLinks }
}

// --- Contenu du widget zone cliquable ---
// La zone n'a aucun rendu propre : elle ne porte que sa cible. Une URL externe s'ouvre
// selon newTab ; un projet mène à sa page (/projects/:id), toujours dans le même onglet
// sur le site public — voir SectionPreview.
export type LinkAreaTarget = 'url' | 'project'

export type LinkAreaContent = {
  target: LinkAreaTarget
  url: string
  projectId: string
  newTab: boolean
}

export const LINK_AREA_TARGET_OPTIONS: { value: LinkAreaTarget; label: string }[] = [
  { value: 'url', label: 'Lien externe' },
  { value: 'project', label: 'Page d’un projet' },
]

export function readLinkAreaContent(content: Record<string, unknown>): LinkAreaContent {
  const target = content.target
  return {
    target: LINK_AREA_TARGET_OPTIONS.some(o => o.value === target) ? (target as LinkAreaTarget) : 'url',
    url: typeof content.url === 'string' ? content.url : '',
    projectId: typeof content.projectId === 'string' ? content.projectId : '',
    newTab: content.newTab !== false,
  }
}

// --- Contenu du widget fond ---
// La couleur n'est pas stockée : elle se déduit de l'empilement (backgroundStacking.ts).
export type BackgroundContent = { radius: number; border: boolean }

export function readBackgroundContent(content: Record<string, unknown>): BackgroundContent {
  const radius = Number(content.radius)
  return {
    radius: Number.isFinite(radius) ? Math.min(Math.max(radius, 0), 64) : 8,
    border: content.border === true,
  }
}

// --- Contenu du widget formulaire de contact ---
// Les champs sont composés dans l'éditeur : le rendu et le backend ne connaissent que
// des paires libellé / valeur. L'adresse de destination n'est PAS ici — elle vit dans
// la variable d'environnement CONTACT_MAIL_TO du backend, jamais dans l'API publique.
export type FormFieldType = 'text' | 'email' | 'textarea'

export type FormField = {
  id: string
  label: string
  type: FormFieldType
  required: boolean
}

export type ContactFormContent = {
  title: string
  fields: FormField[]
  submitLabel: string
  successMessage: string
}

export const FORM_FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Texte court' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Texte long' },
]

export const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: 'name', label: 'Nom', type: 'text', required: true },
  { id: 'email', label: 'Email', type: 'email', required: true },
  { id: 'message', label: 'Message', type: 'textarea', required: true },
]

// Normalise un content brut en ContactFormContent sûr. Un widget fraîchement posé n'a
// aucun champ enregistré : il retombe sur le trio Nom / Email / Message.
export function readContactFormContent(content: Record<string, unknown>): ContactFormContent {
  const rawFields = Array.isArray(content.fields) ? content.fields : []
  const fields = rawFields
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => {
      const type = item.type
      return {
        id: typeof item.id === 'string' && item.id !== '' ? item.id : `field-${index}`,
        label: typeof item.label === 'string' ? item.label : '',
        type: FORM_FIELD_TYPE_OPTIONS.some(o => o.value === type) ? (type as FormFieldType) : 'text',
        required: item.required === true,
      }
    })

  return {
    title: typeof content.title === 'string' ? content.title : '',
    fields: fields.length > 0 ? fields : DEFAULT_FORM_FIELDS.map(f => ({ ...f })),
    submitLabel:
      typeof content.submitLabel === 'string' && content.submitLabel !== '' ? content.submitLabel : 'Envoyer',
    successMessage:
      typeof content.successMessage === 'string' && content.successMessage !== ''
        ? content.successMessage
        : 'Merci, votre message a bien été envoyé.',
  }
}

// --- Jetons de données live (data binding) ---
export type BindingEntity = 'project' | 'feature' | 'ticket'
export type ProjectField = 'name' | 'description' | 'category'
export type FeatureField = 'name' | 'description'
export type TicketField = 'title' | 'description'
export type BindingField = ProjectField | FeatureField | TicketField

export type DataBindingAttrs = {
  entity: BindingEntity
  id: string
  field: BindingField
}

export const BINDING_FIELDS: Record<BindingEntity, { value: BindingField; label: string }[]> = {
  project: [
    { value: 'name', label: 'Nom' },
    { value: 'description', label: 'Description' },
    { value: 'category', label: 'Catégorie' },
  ],
  feature: [
    { value: 'name', label: 'Nom' },
    { value: 'description', label: 'Description' },
  ],
  ticket: [
    { value: 'title', label: 'Titre' },
    { value: 'description', label: 'Description' },
  ],
}

export const BINDING_ENTITY_LABELS: Record<BindingEntity, string> = {
  project: 'Projet',
  feature: 'Feature',
  ticket: 'Ticket',
}
