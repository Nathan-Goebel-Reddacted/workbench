import type { SectionType } from '../widgets'

export type WidgetCategory = 'Text' | 'Media' | 'Links' | 'Project' | 'Layout' | 'Form'

export type Widget = {
  label: string
  icon: string
  category: WidgetCategory
  type: SectionType
}

const WIDGETS: Widget[] = [
  { label: 'Text', icon: '✍️', category: 'Text', type: 'text' },
  { label: 'Code', icon: '⌨️', category: 'Text', type: 'code' },
  { label: 'Document', icon: '📄', category: 'Media', type: 'document' },
  { label: 'Carousel', icon: '🎠', category: 'Media', type: 'carousel' },
  { label: 'Embed', icon: '🧩', category: 'Media', type: 'embed' },
  { label: 'Background', icon: '▧', category: 'Layout', type: 'background' },
  { label: 'Links', icon: '🔗', category: 'Links', type: 'link' },
  { label: 'Clickable area', icon: '🎯', category: 'Links', type: 'linkArea' },
  { label: 'Project card', icon: '📇', category: 'Project', type: 'projectCard' },
  { label: 'Form', icon: '📨', category: 'Form', type: 'contactForm' },
]

const CATEGORY_ORDER: WidgetCategory[] = ['Text', 'Media', 'Layout', 'Links', 'Project', 'Form']

export type WidgetGroup = { category: WidgetCategory; widgets: Widget[] }

export function getWidgetsByCategory(allowedTypes: readonly SectionType[]): WidgetGroup[] {
  const widgets = WIDGETS.filter(widget => allowedTypes.includes(widget.type))
  return CATEGORY_ORDER.map(category => ({ category, widgets: widgets.filter(w => w.category === category) })).filter(
    group => group.widgets.length > 0,
  )
}
