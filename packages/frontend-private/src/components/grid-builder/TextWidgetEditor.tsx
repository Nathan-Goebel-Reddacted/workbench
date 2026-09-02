import { RichTextEditor } from './RichTextEditor'
import type { TextContent } from '@atelier/content-renderer'

type Props = {
  value: TextContent
  onChange: (next: TextContent) => void
  apiUrl: string
}

// Le widget texte est un unique éditeur riche. Les données live (projet/feature/ticket) sont
// insérées comme jetons directement dans l'éditeur via le bouton « ＋ Donnée » du toolbar.
export function TextWidgetEditor({ value, onChange, apiUrl }: Props) {
  return <RichTextEditor html={value.html} onChange={html => onChange({ html })} apiUrl={apiUrl} />
}
