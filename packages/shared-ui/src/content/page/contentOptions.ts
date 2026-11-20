export type PageType = 'portfolio' | 'project'

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

export type FormFieldType = 'text' | 'email' | 'textarea'

export type FormField = {
  id: string
  label: string
  type: FormFieldType
  required: boolean
}

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
