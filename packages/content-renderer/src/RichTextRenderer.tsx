import type { CSSProperties } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { buildRichTextExtensions } from './richTextExtensions'

type Props = { html: string; apiUrl: string }

// Les images insérées dans un texte riche sont stockées en chemin relatif, comme les autres
// médias : le HTML est réécrit au rendu plutôt qu'à l'enregistrement.
function resolveUploadPaths(html: string, apiUrl: string): string {
  return html.replace(/(src|href)="(\/uploads\/[^"]*)"/g, `$1="${apiUrl}$2"`)
}

// Rendu lecture seule du contenu texte, avec les mêmes extensions que l'éditeur (jetons de
// données live compris) : les jetons résolvent leur valeur, le formatage est appliqué à l'identique.
export function RichTextRenderer({ html, apiUrl }: Props) {
  const editor = useEditor(
    {
      editable: false,
      extensions: buildRichTextExtensions(apiUrl),
      content: resolveUploadPaths(html, apiUrl),
    },
    [html, apiUrl],
  )

  if (!editor) return null
  return <EditorContent editor={editor} className="rich-text-content" style={contentStyle} />
}

const contentStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}
