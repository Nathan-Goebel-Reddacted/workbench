// Catalogue de la palette d'édition. Le vocabulaire de base (PageType, SectionType,
// SectionContent) vit dans @atelier/content-renderer : le rendu public en dépend aussi.
import type { PageType, SectionType, SectionContent } from '@atelier/content-renderer'
import { DEFAULT_FORM_FIELDS } from '@atelier/content-renderer'

export type { PageType, SectionType, SectionContent }

export type WidgetCategory = 'Texte' | 'Média' | 'Liens' | 'Projet' | 'Mise en page' | 'Formulaire'

export type Widget = {
  key: string
  label: string
  icon: string
  category: WidgetCategory
  type: SectionType
  defaultContent: SectionContent
  defaultContentRef: string | null
}

// Widget document unifié : une seule entrée de palette pour tout document unitaire.
// La forme du rendu (image, vidéo, PDF, mindmap) se déduit de l'URL choisie — voir
// resolveDocumentKind. Le carrousel reste distinct : c'est une collection.
const MEDIA_WIDGETS: Widget[] = [
  {
    key: 'document',
    label: 'Document',
    icon: '📄',
    category: 'Média',
    type: 'document',
    defaultContent: { url: '', alt: '', fit: 'contain', position: 'center', radius: 4 },
    defaultContentRef: null,
  },
  {
    key: 'carousel',
    label: 'Carrousel',
    icon: '🎠',
    category: 'Média',
    type: 'carousel',
    defaultContent: { items: [] },
    defaultContentRef: null,
  },
]

// Bloc de code : rendu tel quel, sans exécution ni coloration syntaxique.
const CODE_WIDGET: Widget = {
  key: 'code',
  label: 'Code',
  icon: '⌨️',
  category: 'Texte',
  type: 'code',
  defaultContent: { code: '', language: '', wrap: false },
  defaultContentRef: null,
}

// Iframe vers un service tiers (carte, lecteur, démo). L'URL est filtrée au rendu :
// seuls http(s) passent, et l'iframe est sandboxée.
const EMBED_WIDGET: Widget = {
  key: 'embed',
  label: 'Intégration',
  icon: '🧩',
  category: 'Média',
  type: 'embed',
  defaultContent: { url: '', title: '', radius: 4 },
  defaultContentRef: null,
}

// Widget décoratif : se place sous les autres et prend sa couleur par alternance
// (voir backgroundStacking.ts). Aucune couleur n'est choisie à la main.
const BACKGROUND_WIDGET: Widget = {
  key: 'background',
  label: 'Fond',
  icon: '▧',
  category: 'Mise en page',
  type: 'background',
  defaultContent: { radius: 8, border: false },
  defaultContentRef: null,
}

// Widget texte unifié : une seule entrée de palette. La source (raw / portfolio / project)
// et le champ ciblé se choisissent dans les paramètres du widget (voir TextWidgetEditor).
const TEXT_WIDGET: Widget = {
  key: 'text',
  label: 'Texte',
  icon: '✍️',
  category: 'Texte',
  type: 'text',
  defaultContent: { source: 'raw', html: '' },
  defaultContentRef: null,
}

// Widget interactif : le visiteur saisit un message, envoyé par mail au propriétaire du site.
// L'adresse de destination n'est pas ici — elle vit dans CONTACT_MAIL_TO côté backend.
const CONTACT_FORM_WIDGET: Widget = {
  key: 'contactForm',
  label: 'Formulaire',
  icon: '📨',
  category: 'Formulaire',
  type: 'contactForm',
  defaultContent: {
    title: 'Me contacter',
    fields: DEFAULT_FORM_FIELDS.map(field => ({ ...field })),
    submitLabel: 'Envoyer',
    successMessage: 'Merci, votre message a bien été envoyé.',
  },
  defaultContentRef: null,
}

// Zone cliquable : transparente et posée sous les autres widgets, elle ouvre une URL
// externe ou la page d'un projet quand on clique sur sa surface libre.
const LINK_AREA_WIDGET: Widget = {
  key: 'linkArea',
  label: 'Zone cliquable',
  icon: '🎯',
  category: 'Liens',
  type: 'linkArea',
  defaultContent: { target: 'url', url: '', projectId: '', newTab: true },
  defaultContentRef: null,
}

const WIDGETS_BY_PAGE_TYPE: Record<PageType, Widget[]> = {
  portfolio: [
    TEXT_WIDGET,
    CODE_WIDGET,
    ...MEDIA_WIDGETS,
    EMBED_WIDGET,
    BACKGROUND_WIDGET,
    {
      key: 'portfolio.links',
      label: 'Liens',
      icon: '🔗',
      category: 'Liens',
      type: 'link',
      defaultContent: {},
      defaultContentRef: null,
    },
    LINK_AREA_WIDGET,
    CONTACT_FORM_WIDGET,
  ],
  project: [
    TEXT_WIDGET,
    CODE_WIDGET,
    ...MEDIA_WIDGETS,
    EMBED_WIDGET,
    BACKGROUND_WIDGET,
    // Sans contentRef : un widget qui en porte un tombe dans le court-circuit du renderer
    // et ne rend rien en mode public. Les liens de ce widget sont ceux qu'on y saisit.
    {
      key: 'project.links',
      label: 'Liens',
      icon: '🔗',
      category: 'Liens',
      type: 'link',
      defaultContent: {},
      defaultContentRef: null,
    },
    LINK_AREA_WIDGET,
    {
      key: 'projectCard',
      label: 'Bloc projet',
      icon: '📇',
      category: 'Projet',
      type: 'projectCard',
      defaultContent: { projectId: '' },
      defaultContentRef: null,
    },
    CONTACT_FORM_WIDGET,
  ],
}

const CATEGORY_ORDER: WidgetCategory[] = ['Texte', 'Média', 'Mise en page', 'Liens', 'Projet', 'Formulaire']

export type WidgetGroup = { category: WidgetCategory; widgets: Widget[] }

export function getWidgetsByCategory(pageType: PageType): WidgetGroup[] {
  const widgets = WIDGETS_BY_PAGE_TYPE[pageType]
  return CATEGORY_ORDER.map(category => ({ category, widgets: widgets.filter(w => w.category === category) })).filter(
    group => group.widgets.length > 0,
  )
}
