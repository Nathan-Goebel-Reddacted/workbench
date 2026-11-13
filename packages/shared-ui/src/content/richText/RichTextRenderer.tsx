import type { CSSProperties } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { buildRichTextExtensions } from './richTextExtensions'

type Props = { html: string; scale?: number }

// Les images insérées dans un texte riche sont stockées en chemin relatif, comme les autres
// médias : le HTML est réécrit au rendu plutôt qu'à l'enregistrement.
function resolveUploadPaths(html: string, apiUrl: string): string {
  return html.replace(/(src|href)="(\/uploads\/[^"]*)"/g, `$1="${apiUrl}$2"`)
}

// Rendu lecture seule du contenu texte, avec les mêmes extensions que l'éditeur (jetons de
// données live compris) : les jetons résolvent leur valeur, le formatage est appliqué à l'identique.
export function RichTextRenderer({ html, scale = 1 }: Props) {
  const apiUrl = useApiUrl()
  const editor = useEditor(
    {
      editable: false,
      extensions: buildRichTextExtensions(apiUrl),
      content: resolveUploadPaths(html, apiUrl),
    },
    [html, apiUrl],
  )

  if (!editor) return null
  return (
    <EditorContent
      editor={editor}
      className="rich-text-content"
      style={{ ...contentStyle, '--text-scale': scale } as CSSProperties}
    />
  )
}

const contentStyle: CSSProperties = {
  fontSize: 'calc(0.8125rem * var(--text-scale, 1))',
  color: 'var(--color-text)',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}
